import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TierRecord } from "./tier-record.js";

/** Keeps tier records by code. */
export interface TierRecordStore {
  find(code: string): TierRecord | undefined;
  save(item: TierRecord): void;
  remove(code: string): boolean;
  list(): TierRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTierRecordStore implements TierRecordStore {
  items: Map<string, TierRecord>;
  order: string[];

  constructor(items: Map<string, TierRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TierRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TierRecord): void {
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

  list(): TierRecord[] {
    const out: TierRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTierRecordStore(): TierRecordStore {
  return new MemoryTierRecordStore(new Map<string, TierRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTierRecordStore implements TierRecordStore {
  inner: TierRecordStore;
  cache: cache.TtlCache<TierRecord>;
  hits: number;
  misses: number;

  constructor(inner: TierRecordStore, cacheValue: cache.TtlCache<TierRecord>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TierRecord | undefined {
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

  save(item: TierRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TierRecord[] {
    return this.inner.list();
  }
}

export function newCachedTierRecordStore(inner: TierRecordStore, ttl: number, clockValue: clock.Clock): TierRecordStore {
  return new CachedTierRecordStore(inner, cache.newTtlCache<TierRecord>(256, ttl, clockValue), 0, 0);
}

/** Selects tier records. Empty fields match all. */
export class TierRecordQuery {
  region: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.region = region;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TierRecord): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TierRecord[]): TierRecord[] {
    const matched = collections.filter(items, (candidate: TierRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTierRecords(store: TierRecordStore, query: TierRecordQuery): TierRecord[] {
  return query.apply(store.list());
}
