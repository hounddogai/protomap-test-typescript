import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingMacroRecord } from "./rolling-macro-record.js";

/** Keeps rolling macro records by code. */
export interface RollingMacroRecordStore {
  find(code: string): RollingMacroRecord | undefined;
  save(item: RollingMacroRecord): void;
  remove(code: string): boolean;
  list(): RollingMacroRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingMacroRecordStore implements RollingMacroRecordStore {
  items: Map<string, RollingMacroRecord>;
  order: string[];

  constructor(items: Map<string, RollingMacroRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingMacroRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingMacroRecord): void {
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

  list(): RollingMacroRecord[] {
    const out: RollingMacroRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingMacroRecordStore(): RollingMacroRecordStore {
  return new MemoryRollingMacroRecordStore(new Map<string, RollingMacroRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingMacroRecordStore implements RollingMacroRecordStore {
  inner: RollingMacroRecordStore;
  cache: cache.TtlCache<RollingMacroRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingMacroRecordStore,
    cacheValue: cache.TtlCache<RollingMacroRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingMacroRecord | undefined {
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

  save(item: RollingMacroRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingMacroRecord[] {
    return this.inner.list();
  }
}

export function newCachedRollingMacroRecordStore(inner: RollingMacroRecordStore, ttl: number, clockValue: clock.Clock): RollingMacroRecordStore {
  return new CachedRollingMacroRecordStore(inner, cache.newTtlCache<RollingMacroRecord>(1024, ttl, clockValue), 0, 0);
}

/** Selects rolling macro records. Empty fields match all. */
export class RollingMacroRecordQuery {
  name: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minClicks: number, statuses: string[], limit: number) {
    this.name = name;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingMacroRecord): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingMacroRecord[]): RollingMacroRecord[] {
    const matched = collections.filter(items, (candidate: RollingMacroRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingMacroRecords(store: RollingMacroRecordStore, query: RollingMacroRecordQuery): RollingMacroRecord[] {
  return query.apply(store.list());
}
