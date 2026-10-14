import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyDeflectionRecord } from "./legacy-deflection-record.js";

/** Keeps legacy deflection records by code. */
export interface LegacyDeflectionRecordStore {
  find(code: string): LegacyDeflectionRecord | undefined;
  save(item: LegacyDeflectionRecord): void;
  remove(code: string): boolean;
  list(): LegacyDeflectionRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyDeflectionRecordStore implements LegacyDeflectionRecordStore {
  items: Map<string, LegacyDeflectionRecord>;
  order: string[];

  constructor(items: Map<string, LegacyDeflectionRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyDeflectionRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyDeflectionRecord): void {
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

  list(): LegacyDeflectionRecord[] {
    const out: LegacyDeflectionRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyDeflectionRecordStore(): LegacyDeflectionRecordStore {
  return new MemoryLegacyDeflectionRecordStore(new Map<string, LegacyDeflectionRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyDeflectionRecordStore implements LegacyDeflectionRecordStore {
  inner: LegacyDeflectionRecordStore;
  cache: cache.TtlCache<LegacyDeflectionRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyDeflectionRecordStore,
    cacheValue: cache.TtlCache<LegacyDeflectionRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyDeflectionRecord | undefined {
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

  save(item: LegacyDeflectionRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyDeflectionRecord[] {
    return this.inner.list();
  }
}

export function newCachedLegacyDeflectionRecordStore(inner: LegacyDeflectionRecordStore, ttl: number, clockValue: clock.Clock): LegacyDeflectionRecordStore {
  return new CachedLegacyDeflectionRecordStore(
    inner,
    cache.newTtlCache<LegacyDeflectionRecord>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy deflection records. Empty fields match all. */
export class LegacyDeflectionRecordQuery {
  title: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minImpressions: number, statuses: string[], limit: number) {
    this.title = title;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyDeflectionRecord): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyDeflectionRecord[]): LegacyDeflectionRecord[] {
    const matched = collections.filter(items, (candidate: LegacyDeflectionRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyDeflectionRecords(store: LegacyDeflectionRecordStore, query: LegacyDeflectionRecordQuery): LegacyDeflectionRecord[] {
  return query.apply(store.list());
}
