import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredStepRecord } from "./tiered-step-record.js";

/** Keeps tiered step records by code. */
export interface TieredStepRecordStore {
  find(code: string): TieredStepRecord | undefined;
  save(item: TieredStepRecord): void;
  remove(code: string): boolean;
  list(): TieredStepRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredStepRecordStore implements TieredStepRecordStore {
  items: Map<string, TieredStepRecord>;
  order: string[];

  constructor(items: Map<string, TieredStepRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredStepRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredStepRecord): void {
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

  list(): TieredStepRecord[] {
    const out: TieredStepRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredStepRecordStore(): TieredStepRecordStore {
  return new MemoryTieredStepRecordStore(new Map<string, TieredStepRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredStepRecordStore implements TieredStepRecordStore {
  inner: TieredStepRecordStore;
  cache: cache.TtlCache<TieredStepRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredStepRecordStore,
    cacheValue: cache.TtlCache<TieredStepRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredStepRecord | undefined {
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

  save(item: TieredStepRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredStepRecord[] {
    return this.inner.list();
  }
}

export function newCachedTieredStepRecordStore(inner: TieredStepRecordStore, ttl: number, clockValue: clock.Clock): TieredStepRecordStore {
  return new CachedTieredStepRecordStore(inner, cache.newTtlCache<TieredStepRecord>(512, ttl, clockValue), 0, 0);
}

/** Selects tiered step records. Empty fields match all. */
export class TieredStepRecordQuery {
  region: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minOpenRate: number, statuses: string[], limit: number) {
    this.region = region;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredStepRecord): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredStepRecord[]): TieredStepRecord[] {
    const matched = collections.filter(items, (candidate: TieredStepRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredStepRecords(store: TieredStepRecordStore, query: TieredStepRecordQuery): TieredStepRecord[] {
  return query.apply(store.list());
}
