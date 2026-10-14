import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitWindow } from "./wait-window.js";

/** Keeps wait windows by code. */
export interface WaitWindowStore {
  find(code: string): WaitWindow | undefined;
  save(item: WaitWindow): void;
  remove(code: string): boolean;
  list(): WaitWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitWindowStore implements WaitWindowStore {
  items: Map<string, WaitWindow>;
  order: string[];

  constructor(items: Map<string, WaitWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitWindow): void {
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

  list(): WaitWindow[] {
    const out: WaitWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitWindowStore(): WaitWindowStore {
  return new MemoryWaitWindowStore(new Map<string, WaitWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitWindowStore implements WaitWindowStore {
  inner: WaitWindowStore;
  cache: cache.TtlCache<WaitWindow>;
  hits: number;
  misses: number;

  constructor(inner: WaitWindowStore, cacheValue: cache.TtlCache<WaitWindow>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitWindow | undefined {
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

  save(item: WaitWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitWindow[] {
    return this.inner.list();
  }
}

export function newCachedWaitWindowStore(inner: WaitWindowStore, ttl: number, clockValue: clock.Clock): WaitWindowStore {
  return new CachedWaitWindowStore(inner, cache.newTtlCache<WaitWindow>(1024, ttl, clockValue), 0, 0);
}

/** Selects wait windows. Empty fields match all. */
export class WaitWindowQuery {
  unit: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minBid: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitWindow): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitWindow[]): WaitWindow[] {
    const matched = collections.filter(items, (candidate: WaitWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitWindows(store: WaitWindowStore, query: WaitWindowQuery): WaitWindow[] {
  return query.apply(store.list());
}
