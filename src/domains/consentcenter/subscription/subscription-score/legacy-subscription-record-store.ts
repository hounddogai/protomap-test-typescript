import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacySubscriptionRecord } from "./legacy-subscription-record.js";

/** Keeps legacy subscription records by code. */
export interface LegacySubscriptionRecordStore {
  find(code: string): LegacySubscriptionRecord | undefined;
  save(item: LegacySubscriptionRecord): void;
  remove(code: string): boolean;
  list(): LegacySubscriptionRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacySubscriptionRecordStore implements LegacySubscriptionRecordStore {
  items: Map<string, LegacySubscriptionRecord>;
  order: string[];

  constructor(items: Map<string, LegacySubscriptionRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacySubscriptionRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacySubscriptionRecord): void {
    if (!this.items.has(item.code)) {
      this.order.push(item.code);
    }
    this.items.set(item.code, item);
  }

  remove(code: string): boolean {
    if (!this.items.has(code)) return false;
    this.items.delete(code);
    const kept: string[] = [];
    for (const existing of this.order) {
      if (existing !== code) {
        kept.push(existing);
      }
    }
    this.order = kept;
    return true;
  }

  list(): LegacySubscriptionRecord[] {
    const out: LegacySubscriptionRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacySubscriptionRecordStore(): LegacySubscriptionRecordStore {
  return new MemoryLegacySubscriptionRecordStore(new Map<string, LegacySubscriptionRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacySubscriptionRecordStore implements LegacySubscriptionRecordStore {
  inner: LegacySubscriptionRecordStore;
  cache: cache.TtlCache<LegacySubscriptionRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacySubscriptionRecordStore,
    cacheValue: cache.TtlCache<LegacySubscriptionRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacySubscriptionRecord | undefined {
    const hit = this.cache.get(code);
    if (hit === undefined) {
      this.misses += 1;
      const found = this.inner.find(code);
      if (found === undefined) return undefined;
      this.cache.put(code, found);
      return found;
    }
    this.hits += 1;
    return hit;
  }

  save(item: LegacySubscriptionRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacySubscriptionRecord[] {
    return this.inner.list();
  }
}

export function newCachedLegacySubscriptionRecordStore(inner: LegacySubscriptionRecordStore, ttl: number, clockValue: clock.Clock): LegacySubscriptionRecordStore {
  return new CachedLegacySubscriptionRecordStore(
    inner,
    cache.newTtlCache<LegacySubscriptionRecord>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy subscription records. Empty fields match all. */
export class LegacySubscriptionRecordQuery {
  utmSource: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minFloorValue: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacySubscriptionRecord): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacySubscriptionRecord[]): LegacySubscriptionRecord[] {
    const matched = collections.filter(items, (candidate: LegacySubscriptionRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacySubscriptionRecords(store: LegacySubscriptionRecordStore, query: LegacySubscriptionRecordQuery): LegacySubscriptionRecord[] {
  return query.apply(store.list());
}
