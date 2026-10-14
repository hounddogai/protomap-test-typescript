import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowEntry } from "./window-entry.js";

/** Keeps window entries by code. */
export interface WindowEntryStore {
  find(code: string): WindowEntry | undefined;
  save(item: WindowEntry): void;
  remove(code: string): boolean;
  list(): WindowEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowEntryStore implements WindowEntryStore {
  items: Map<string, WindowEntry>;
  order: string[];

  constructor(items: Map<string, WindowEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowEntry): void {
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

  list(): WindowEntry[] {
    const out: WindowEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowEntryStore(): WindowEntryStore {
  return new MemoryWindowEntryStore(new Map<string, WindowEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowEntryStore implements WindowEntryStore {
  inner: WindowEntryStore;
  cache: cache.TtlCache<WindowEntry>;
  hits: number;
  misses: number;

  constructor(inner: WindowEntryStore, cacheValue: cache.TtlCache<WindowEntry>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowEntry | undefined {
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

  save(item: WindowEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowEntry[] {
    return this.inner.list();
  }
}

export function newCachedWindowEntryStore(inner: WindowEntryStore, ttl: number, clockValue: clock.Clock): WindowEntryStore {
  return new CachedWindowEntryStore(inner, cache.newTtlCache<WindowEntry>(1024, ttl, clockValue), 0, 0);
}

/** Selects window entries. Empty fields match all. */
export class WindowEntryQuery {
  region: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minMargin: number, statuses: string[], limit: number) {
    this.region = region;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WindowEntry): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowEntry[]): WindowEntry[] {
    const matched = collections.filter(items, (candidate: WindowEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowEntries(store: WindowEntryStore, query: WindowEntryQuery): WindowEntry[] {
  return query.apply(store.list());
}
