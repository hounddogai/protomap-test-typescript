import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveOptOutRecord } from "./adaptive-opt-out-record.js";

/** Keeps adaptive opt out records by code. */
export interface AdaptiveOptOutRecordStore {
  find(code: string): AdaptiveOptOutRecord | undefined;
  save(item: AdaptiveOptOutRecord): void;
  remove(code: string): boolean;
  list(): AdaptiveOptOutRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveOptOutRecordStore implements AdaptiveOptOutRecordStore {
  items: Map<string, AdaptiveOptOutRecord>;
  order: string[];

  constructor(items: Map<string, AdaptiveOptOutRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveOptOutRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveOptOutRecord): void {
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

  list(): AdaptiveOptOutRecord[] {
    const out: AdaptiveOptOutRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveOptOutRecordStore(): AdaptiveOptOutRecordStore {
  return new MemoryAdaptiveOptOutRecordStore(new Map<string, AdaptiveOptOutRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveOptOutRecordStore implements AdaptiveOptOutRecordStore {
  inner: AdaptiveOptOutRecordStore;
  cache: cache.TtlCache<AdaptiveOptOutRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveOptOutRecordStore,
    cacheValue: cache.TtlCache<AdaptiveOptOutRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveOptOutRecord | undefined {
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

  save(item: AdaptiveOptOutRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveOptOutRecord[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveOptOutRecordStore(inner: AdaptiveOptOutRecordStore, ttl: number, clockValue: clock.Clock): AdaptiveOptOutRecordStore {
  return new CachedAdaptiveOptOutRecordStore(
    inner,
    cache.newTtlCache<AdaptiveOptOutRecord>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive opt out records. Empty fields match all. */
export class AdaptiveOptOutRecordQuery {
  label: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveOptOutRecord): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveOptOutRecord[]): AdaptiveOptOutRecord[] {
    const matched = collections.filter(items, (candidate: AdaptiveOptOutRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveOptOutRecords(store: AdaptiveOptOutRecordStore, query: AdaptiveOptOutRecordQuery): AdaptiveOptOutRecord[] {
  return query.apply(store.list());
}
