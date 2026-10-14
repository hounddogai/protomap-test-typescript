import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedWaitWindow } from "./capped-wait-window.js";

/** Keeps capped wait windows by code. */
export interface CappedWaitWindowStore {
  find(code: string): CappedWaitWindow | undefined;
  save(item: CappedWaitWindow): void;
  remove(code: string): boolean;
  list(): CappedWaitWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedWaitWindowStore implements CappedWaitWindowStore {
  items: Map<string, CappedWaitWindow>;
  order: string[];

  constructor(items: Map<string, CappedWaitWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedWaitWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedWaitWindow): void {
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

  list(): CappedWaitWindow[] {
    const out: CappedWaitWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedWaitWindowStore(): CappedWaitWindowStore {
  return new MemoryCappedWaitWindowStore(new Map<string, CappedWaitWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedWaitWindowStore implements CappedWaitWindowStore {
  inner: CappedWaitWindowStore;
  cache: cache.TtlCache<CappedWaitWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedWaitWindowStore,
    cacheValue: cache.TtlCache<CappedWaitWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedWaitWindow | undefined {
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

  save(item: CappedWaitWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedWaitWindow[] {
    return this.inner.list();
  }
}

export function newCachedCappedWaitWindowStore(inner: CappedWaitWindowStore, ttl: number, clockValue: clock.Clock): CappedWaitWindowStore {
  return new CachedCappedWaitWindowStore(inner, cache.newTtlCache<CappedWaitWindow>(64, ttl, clockValue), 0, 0);
}

/** Selects capped wait windows. Empty fields match all. */
export class CappedWaitWindowQuery {
  category: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minCapacity: number, statuses: string[], limit: number) {
    this.category = category;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedWaitWindow): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedWaitWindow[]): CappedWaitWindow[] {
    const matched = collections.filter(items, (candidate: CappedWaitWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedWaitWindows(store: CappedWaitWindowStore, query: CappedWaitWindowQuery): CappedWaitWindow[] {
  return query.apply(store.list());
}
