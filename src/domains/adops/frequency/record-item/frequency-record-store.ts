import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencyRecord } from "./frequency-record.js";

/** Keeps frequency records by code. */
export interface FrequencyRecordStore {
  find(code: string): FrequencyRecord | undefined;
  save(item: FrequencyRecord): void;
  remove(code: string): boolean;
  list(): FrequencyRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencyRecordStore implements FrequencyRecordStore {
  items: Map<string, FrequencyRecord>;
  order: string[];

  constructor(items: Map<string, FrequencyRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencyRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencyRecord): void {
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

  list(): FrequencyRecord[] {
    const out: FrequencyRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencyRecordStore(): FrequencyRecordStore {
  return new MemoryFrequencyRecordStore(new Map<string, FrequencyRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencyRecordStore implements FrequencyRecordStore {
  inner: FrequencyRecordStore;
  cache: cache.TtlCache<FrequencyRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: FrequencyRecordStore,
    cacheValue: cache.TtlCache<FrequencyRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencyRecord | undefined {
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

  save(item: FrequencyRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencyRecord[] {
    return this.inner.list();
  }
}

export function newCachedFrequencyRecordStore(inner: FrequencyRecordStore, ttl: number, clockValue: clock.Clock): FrequencyRecordStore {
  return new CachedFrequencyRecordStore(inner, cache.newTtlCache<FrequencyRecord>(128, ttl, clockValue), 0, 0);
}

/** Selects frequency records. Empty fields match all. */
export class FrequencyRecordQuery {
  segment: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencyRecord): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencyRecord[]): FrequencyRecord[] {
    const matched = collections.filter(items, (candidate: FrequencyRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencyRecords(store: FrequencyRecordStore, query: FrequencyRecordQuery): FrequencyRecord[] {
  return query.apply(store.list());
}
