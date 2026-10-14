import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredMacroRecord } from "./tiered-macro-record.js";

/** Keeps tiered macro records by code. */
export interface TieredMacroRecordStore {
  find(code: string): TieredMacroRecord | undefined;
  save(item: TieredMacroRecord): void;
  remove(code: string): boolean;
  list(): TieredMacroRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredMacroRecordStore implements TieredMacroRecordStore {
  items: Map<string, TieredMacroRecord>;
  order: string[];

  constructor(items: Map<string, TieredMacroRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredMacroRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredMacroRecord): void {
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

  list(): TieredMacroRecord[] {
    const out: TieredMacroRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredMacroRecordStore(): TieredMacroRecordStore {
  return new MemoryTieredMacroRecordStore(new Map<string, TieredMacroRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredMacroRecordStore implements TieredMacroRecordStore {
  inner: TieredMacroRecordStore;
  cache: cache.TtlCache<TieredMacroRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredMacroRecordStore,
    cacheValue: cache.TtlCache<TieredMacroRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredMacroRecord | undefined {
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

  save(item: TieredMacroRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredMacroRecord[] {
    return this.inner.list();
  }
}

export function newCachedTieredMacroRecordStore(inner: TieredMacroRecordStore, ttl: number, clockValue: clock.Clock): TieredMacroRecordStore {
  return new CachedTieredMacroRecordStore(inner, cache.newTtlCache<TieredMacroRecord>(512, ttl, clockValue), 0, 0);
}

/** Selects tiered macro records. Empty fields match all. */
export class TieredMacroRecordQuery {
  source: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minThreshold: number, statuses: string[], limit: number) {
    this.source = source;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredMacroRecord): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredMacroRecord[]): TieredMacroRecord[] {
    const matched = collections.filter(items, (candidate: TieredMacroRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredMacroRecords(store: TieredMacroRecordStore, query: TieredMacroRecordQuery): TieredMacroRecord[] {
  return query.apply(store.list());
}
