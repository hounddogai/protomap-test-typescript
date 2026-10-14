import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientFrequencyRecord } from "./lenient-frequency-record.js";

/** Keeps lenient frequency records by code. */
export interface LenientFrequencyRecordStore {
  find(code: string): LenientFrequencyRecord | undefined;
  save(item: LenientFrequencyRecord): void;
  remove(code: string): boolean;
  list(): LenientFrequencyRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientFrequencyRecordStore implements LenientFrequencyRecordStore {
  items: Map<string, LenientFrequencyRecord>;
  order: string[];

  constructor(items: Map<string, LenientFrequencyRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientFrequencyRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientFrequencyRecord): void {
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

  list(): LenientFrequencyRecord[] {
    const out: LenientFrequencyRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientFrequencyRecordStore(): LenientFrequencyRecordStore {
  return new MemoryLenientFrequencyRecordStore(new Map<string, LenientFrequencyRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientFrequencyRecordStore implements LenientFrequencyRecordStore {
  inner: LenientFrequencyRecordStore;
  cache: cache.TtlCache<LenientFrequencyRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientFrequencyRecordStore,
    cacheValue: cache.TtlCache<LenientFrequencyRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientFrequencyRecord | undefined {
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

  save(item: LenientFrequencyRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientFrequencyRecord[] {
    return this.inner.list();
  }
}

export function newCachedLenientFrequencyRecordStore(inner: LenientFrequencyRecordStore, ttl: number, clockValue: clock.Clock): LenientFrequencyRecordStore {
  return new CachedLenientFrequencyRecordStore(
    inner,
    cache.newTtlCache<LenientFrequencyRecord>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient frequency records. Empty fields match all. */
export class LenientFrequencyRecordQuery {
  locale: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCeiling: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientFrequencyRecord): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientFrequencyRecord[]): LenientFrequencyRecord[] {
    const matched = collections.filter(items, (candidate: LenientFrequencyRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientFrequencyRecords(store: LenientFrequencyRecordStore, query: LenientFrequencyRecordQuery): LenientFrequencyRecord[] {
  return query.apply(store.list());
}
