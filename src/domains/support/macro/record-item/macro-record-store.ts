import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MacroRecord } from "./macro-record.js";

/** Keeps macro records by code. */
export interface MacroRecordStore {
  find(code: string): MacroRecord | undefined;
  save(item: MacroRecord): void;
  remove(code: string): boolean;
  list(): MacroRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMacroRecordStore implements MacroRecordStore {
  items: Map<string, MacroRecord>;
  order: string[];

  constructor(items: Map<string, MacroRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MacroRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MacroRecord): void {
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

  list(): MacroRecord[] {
    const out: MacroRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMacroRecordStore(): MacroRecordStore {
  return new MemoryMacroRecordStore(new Map<string, MacroRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMacroRecordStore implements MacroRecordStore {
  inner: MacroRecordStore;
  cache: cache.TtlCache<MacroRecord>;
  hits: number;
  misses: number;

  constructor(inner: MacroRecordStore, cacheValue: cache.TtlCache<MacroRecord>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MacroRecord | undefined {
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

  save(item: MacroRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MacroRecord[] {
    return this.inner.list();
  }
}

export function newCachedMacroRecordStore(inner: MacroRecordStore, ttl: number, clockValue: clock.Clock): MacroRecordStore {
  return new CachedMacroRecordStore(inner, cache.newTtlCache<MacroRecord>(64, ttl, clockValue), 0, 0);
}

/** Selects macro records. Empty fields match all. */
export class MacroRecordQuery {
  region: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minWindowDays: number, statuses: string[], limit: number) {
    this.region = region;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MacroRecord): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MacroRecord[]): MacroRecord[] {
    const matched = collections.filter(items, (candidate: MacroRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMacroRecords(store: MacroRecordStore, query: MacroRecordQuery): MacroRecord[] {
  return query.apply(store.list());
}
