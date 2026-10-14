import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TouchpointWindow } from "./touchpoint-window.js";

/** Keeps touchpoint windows by code. */
export interface TouchpointWindowStore {
  find(code: string): TouchpointWindow | undefined;
  save(item: TouchpointWindow): void;
  remove(code: string): boolean;
  list(): TouchpointWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTouchpointWindowStore implements TouchpointWindowStore {
  items: Map<string, TouchpointWindow>;
  order: string[];

  constructor(items: Map<string, TouchpointWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TouchpointWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TouchpointWindow): void {
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

  list(): TouchpointWindow[] {
    const out: TouchpointWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTouchpointWindowStore(): TouchpointWindowStore {
  return new MemoryTouchpointWindowStore(new Map<string, TouchpointWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTouchpointWindowStore implements TouchpointWindowStore {
  inner: TouchpointWindowStore;
  cache: cache.TtlCache<TouchpointWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: TouchpointWindowStore,
    cacheValue: cache.TtlCache<TouchpointWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TouchpointWindow | undefined {
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

  save(item: TouchpointWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TouchpointWindow[] {
    return this.inner.list();
  }
}

export function newCachedTouchpointWindowStore(inner: TouchpointWindowStore, ttl: number, clockValue: clock.Clock): TouchpointWindowStore {
  return new CachedTouchpointWindowStore(inner, cache.newTtlCache<TouchpointWindow>(1024, ttl, clockValue), 0, 0);
}

/** Selects touchpoint windows. Empty fields match all. */
export class TouchpointWindowQuery {
  name: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCost: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TouchpointWindow): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TouchpointWindow[]): TouchpointWindow[] {
    const matched = collections.filter(items, (candidate: TouchpointWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTouchpointWindows(store: TouchpointWindowStore, query: TouchpointWindowQuery): TouchpointWindow[] {
  return query.apply(store.list());
}
