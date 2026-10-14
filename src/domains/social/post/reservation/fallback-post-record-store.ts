import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackPostRecord } from "./fallback-post-record.js";

/** Keeps fallback post records by code. */
export interface FallbackPostRecordStore {
  find(code: string): FallbackPostRecord | undefined;
  save(item: FallbackPostRecord): void;
  remove(code: string): boolean;
  list(): FallbackPostRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackPostRecordStore implements FallbackPostRecordStore {
  items: Map<string, FallbackPostRecord>;
  order: string[];

  constructor(items: Map<string, FallbackPostRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackPostRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackPostRecord): void {
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

  list(): FallbackPostRecord[] {
    const out: FallbackPostRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackPostRecordStore(): FallbackPostRecordStore {
  return new MemoryFallbackPostRecordStore(new Map<string, FallbackPostRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackPostRecordStore implements FallbackPostRecordStore {
  inner: FallbackPostRecordStore;
  cache: cache.TtlCache<FallbackPostRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackPostRecordStore,
    cacheValue: cache.TtlCache<FallbackPostRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackPostRecord | undefined {
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

  save(item: FallbackPostRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackPostRecord[] {
    return this.inner.list();
  }
}

export function newCachedFallbackPostRecordStore(inner: FallbackPostRecordStore, ttl: number, clockValue: clock.Clock): FallbackPostRecordStore {
  return new CachedFallbackPostRecordStore(inner, cache.newTtlCache<FallbackPostRecord>(128, ttl, clockValue), 0, 0);
}

/** Selects fallback post records. Empty fields match all. */
export class FallbackPostRecordQuery {
  segment: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minCapacity: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackPostRecord): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackPostRecord[]): FallbackPostRecord[] {
    const matched = collections.filter(items, (candidate: FallbackPostRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackPostRecords(store: FallbackPostRecordStore, query: FallbackPostRecordQuery): FallbackPostRecord[] {
  return query.apply(store.list());
}
