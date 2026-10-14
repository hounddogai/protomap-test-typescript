import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalStreakRecord } from "./regional-streak-record.js";

/** Keeps regional streak records by code. */
export interface RegionalStreakRecordStore {
  find(code: string): RegionalStreakRecord | undefined;
  save(item: RegionalStreakRecord): void;
  remove(code: string): boolean;
  list(): RegionalStreakRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalStreakRecordStore implements RegionalStreakRecordStore {
  items: Map<string, RegionalStreakRecord>;
  order: string[];

  constructor(items: Map<string, RegionalStreakRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalStreakRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalStreakRecord): void {
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

  list(): RegionalStreakRecord[] {
    const out: RegionalStreakRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalStreakRecordStore(): RegionalStreakRecordStore {
  return new MemoryRegionalStreakRecordStore(new Map<string, RegionalStreakRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalStreakRecordStore implements RegionalStreakRecordStore {
  inner: RegionalStreakRecordStore;
  cache: cache.TtlCache<RegionalStreakRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalStreakRecordStore,
    cacheValue: cache.TtlCache<RegionalStreakRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalStreakRecord | undefined {
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

  save(item: RegionalStreakRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalStreakRecord[] {
    return this.inner.list();
  }
}

export function newCachedRegionalStreakRecordStore(inner: RegionalStreakRecordStore, ttl: number, clockValue: clock.Clock): RegionalStreakRecordStore {
  return new CachedRegionalStreakRecordStore(
    inner,
    cache.newTtlCache<RegionalStreakRecord>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional streak records. Empty fields match all. */
export class RegionalStreakRecordQuery {
  source: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minBatchSize: number, statuses: string[], limit: number) {
    this.source = source;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalStreakRecord): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalStreakRecord[]): RegionalStreakRecord[] {
    const matched = collections.filter(items, (candidate: RegionalStreakRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalStreakRecords(store: RegionalStreakRecordStore, query: RegionalStreakRecordQuery): RegionalStreakRecord[] {
  return query.apply(store.list());
}
