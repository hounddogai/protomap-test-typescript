import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedReplyRecord } from "./weighted-reply-record.js";

/** Keeps weighted reply records by code. */
export interface WeightedReplyRecordStore {
  find(code: string): WeightedReplyRecord | undefined;
  save(item: WeightedReplyRecord): void;
  remove(code: string): boolean;
  list(): WeightedReplyRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedReplyRecordStore implements WeightedReplyRecordStore {
  items: Map<string, WeightedReplyRecord>;
  order: string[];

  constructor(items: Map<string, WeightedReplyRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedReplyRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedReplyRecord): void {
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

  list(): WeightedReplyRecord[] {
    const out: WeightedReplyRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedReplyRecordStore(): WeightedReplyRecordStore {
  return new MemoryWeightedReplyRecordStore(new Map<string, WeightedReplyRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedReplyRecordStore implements WeightedReplyRecordStore {
  inner: WeightedReplyRecordStore;
  cache: cache.TtlCache<WeightedReplyRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedReplyRecordStore,
    cacheValue: cache.TtlCache<WeightedReplyRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedReplyRecord | undefined {
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

  save(item: WeightedReplyRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedReplyRecord[] {
    return this.inner.list();
  }
}

export function newCachedWeightedReplyRecordStore(inner: WeightedReplyRecordStore, ttl: number, clockValue: clock.Clock): WeightedReplyRecordStore {
  return new CachedWeightedReplyRecordStore(inner, cache.newTtlCache<WeightedReplyRecord>(64, ttl, clockValue), 0, 0);
}

/** Selects weighted reply records. Empty fields match all. */
export class WeightedReplyRecordQuery {
  title: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRetries: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedReplyRecord): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedReplyRecord[]): WeightedReplyRecord[] {
    const matched = collections.filter(items, (candidate: WeightedReplyRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedReplyRecords(store: WeightedReplyRecordStore, query: WeightedReplyRecordQuery): WeightedReplyRecord[] {
  return query.apply(store.list());
}
