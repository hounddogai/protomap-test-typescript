import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledWarmupRecord } from "./scheduled-warmup-record.js";

/** Keeps scheduled warmup records by code. */
export interface ScheduledWarmupRecordStore {
  find(code: string): ScheduledWarmupRecord | undefined;
  save(item: ScheduledWarmupRecord): void;
  remove(code: string): boolean;
  list(): ScheduledWarmupRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledWarmupRecordStore implements ScheduledWarmupRecordStore {
  items: Map<string, ScheduledWarmupRecord>;
  order: string[];

  constructor(items: Map<string, ScheduledWarmupRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledWarmupRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledWarmupRecord): void {
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

  list(): ScheduledWarmupRecord[] {
    const out: ScheduledWarmupRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledWarmupRecordStore(): ScheduledWarmupRecordStore {
  return new MemoryScheduledWarmupRecordStore(new Map<string, ScheduledWarmupRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledWarmupRecordStore implements ScheduledWarmupRecordStore {
  inner: ScheduledWarmupRecordStore;
  cache: cache.TtlCache<ScheduledWarmupRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledWarmupRecordStore,
    cacheValue: cache.TtlCache<ScheduledWarmupRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledWarmupRecord | undefined {
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

  save(item: ScheduledWarmupRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledWarmupRecord[] {
    return this.inner.list();
  }
}

export function newCachedScheduledWarmupRecordStore(inner: ScheduledWarmupRecordStore, ttl: number, clockValue: clock.Clock): ScheduledWarmupRecordStore {
  return new CachedScheduledWarmupRecordStore(
    inner,
    cache.newTtlCache<ScheduledWarmupRecord>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled warmup records. Empty fields match all. */
export class ScheduledWarmupRecordQuery {
  region: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCapacity: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledWarmupRecord): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledWarmupRecord[]): ScheduledWarmupRecord[] {
    const matched = collections.filter(items, (candidate: ScheduledWarmupRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledWarmupRecords(store: ScheduledWarmupRecordStore, query: ScheduledWarmupRecordQuery): ScheduledWarmupRecord[] {
  return query.apply(store.list());
}
