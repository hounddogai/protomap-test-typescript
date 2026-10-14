import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedTierRecord } from "./weighted-tier-record.js";

/** Keeps weighted tier records by code. */
export interface WeightedTierRecordStore {
  find(code: string): WeightedTierRecord | undefined;
  save(item: WeightedTierRecord): void;
  remove(code: string): boolean;
  list(): WeightedTierRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedTierRecordStore implements WeightedTierRecordStore {
  items: Map<string, WeightedTierRecord>;
  order: string[];

  constructor(items: Map<string, WeightedTierRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedTierRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedTierRecord): void {
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

  list(): WeightedTierRecord[] {
    const out: WeightedTierRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedTierRecordStore(): WeightedTierRecordStore {
  return new MemoryWeightedTierRecordStore(new Map<string, WeightedTierRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedTierRecordStore implements WeightedTierRecordStore {
  inner: WeightedTierRecordStore;
  cache: cache.TtlCache<WeightedTierRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedTierRecordStore,
    cacheValue: cache.TtlCache<WeightedTierRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedTierRecord | undefined {
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

  save(item: WeightedTierRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedTierRecord[] {
    return this.inner.list();
  }
}

export function newCachedWeightedTierRecordStore(inner: WeightedTierRecordStore, ttl: number, clockValue: clock.Clock): WeightedTierRecordStore {
  return new CachedWeightedTierRecordStore(inner, cache.newTtlCache<WeightedTierRecord>(512, ttl, clockValue), 0, 0);
}

/** Selects weighted tier records. Empty fields match all. */
export class WeightedTierRecordQuery {
  category: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.category = category;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedTierRecord): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedTierRecord[]): WeightedTierRecord[] {
    const matched = collections.filter(items, (candidate: WeightedTierRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedTierRecords(store: WeightedTierRecordStore, query: WeightedTierRecordQuery): WeightedTierRecord[] {
  return query.apply(store.list());
}
