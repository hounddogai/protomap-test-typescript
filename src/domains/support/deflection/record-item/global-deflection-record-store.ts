import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalDeflectionRecord } from "./global-deflection-record.js";

/** Keeps global deflection records by code. */
export interface GlobalDeflectionRecordStore {
  find(code: string): GlobalDeflectionRecord | undefined;
  save(item: GlobalDeflectionRecord): void;
  remove(code: string): boolean;
  list(): GlobalDeflectionRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalDeflectionRecordStore implements GlobalDeflectionRecordStore {
  items: Map<string, GlobalDeflectionRecord>;
  order: string[];

  constructor(items: Map<string, GlobalDeflectionRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalDeflectionRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalDeflectionRecord): void {
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

  list(): GlobalDeflectionRecord[] {
    const out: GlobalDeflectionRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalDeflectionRecordStore(): GlobalDeflectionRecordStore {
  return new MemoryGlobalDeflectionRecordStore(new Map<string, GlobalDeflectionRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalDeflectionRecordStore implements GlobalDeflectionRecordStore {
  inner: GlobalDeflectionRecordStore;
  cache: cache.TtlCache<GlobalDeflectionRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalDeflectionRecordStore,
    cacheValue: cache.TtlCache<GlobalDeflectionRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalDeflectionRecord | undefined {
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

  save(item: GlobalDeflectionRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalDeflectionRecord[] {
    return this.inner.list();
  }
}

export function newCachedGlobalDeflectionRecordStore(inner: GlobalDeflectionRecordStore, ttl: number, clockValue: clock.Clock): GlobalDeflectionRecordStore {
  return new CachedGlobalDeflectionRecordStore(
    inner,
    cache.newTtlCache<GlobalDeflectionRecord>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global deflection records. Empty fields match all. */
export class GlobalDeflectionRecordQuery {
  label: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCeiling: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalDeflectionRecord): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalDeflectionRecord[]): GlobalDeflectionRecord[] {
    const matched = collections.filter(items, (candidate: GlobalDeflectionRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalDeflectionRecords(store: GlobalDeflectionRecordStore, query: GlobalDeflectionRecordQuery): GlobalDeflectionRecord[] {
  return query.apply(store.list());
}
