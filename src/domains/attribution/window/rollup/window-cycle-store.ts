import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowCycle } from "./window-cycle.js";

/** Keeps window cycles by code. */
export interface WindowCycleStore {
  find(code: string): WindowCycle | undefined;
  save(item: WindowCycle): void;
  remove(code: string): boolean;
  list(): WindowCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowCycleStore implements WindowCycleStore {
  items: Map<string, WindowCycle>;
  order: string[];

  constructor(items: Map<string, WindowCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowCycle): void {
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

  list(): WindowCycle[] {
    const out: WindowCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowCycleStore(): WindowCycleStore {
  return new MemoryWindowCycleStore(new Map<string, WindowCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowCycleStore implements WindowCycleStore {
  inner: WindowCycleStore;
  cache: cache.TtlCache<WindowCycle>;
  hits: number;
  misses: number;

  constructor(inner: WindowCycleStore, cacheValue: cache.TtlCache<WindowCycle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowCycle | undefined {
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

  save(item: WindowCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowCycle[] {
    return this.inner.list();
  }
}

export function newCachedWindowCycleStore(inner: WindowCycleStore, ttl: number, clockValue: clock.Clock): WindowCycleStore {
  return new CachedWindowCycleStore(inner, cache.newTtlCache<WindowCycle>(64, ttl, clockValue), 0, 0);
}

/** Selects window cycles. Empty fields match all. */
export class WindowCycleQuery {
  title: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCeiling: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WindowCycle): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowCycle[]): WindowCycle[] {
    const matched = collections.filter(items, (candidate: WindowCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowCycles(store: WindowCycleStore, query: WindowCycleQuery): WindowCycle[] {
  return query.apply(store.list());
}
