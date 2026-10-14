import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitException } from "./wait-exception.js";

/** Keeps wait exceptions by code. */
export interface WaitExceptionStore {
  find(code: string): WaitException | undefined;
  save(item: WaitException): void;
  remove(code: string): boolean;
  list(): WaitException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitExceptionStore implements WaitExceptionStore {
  items: Map<string, WaitException>;
  order: string[];

  constructor(items: Map<string, WaitException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitException): void {
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

  list(): WaitException[] {
    const out: WaitException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitExceptionStore(): WaitExceptionStore {
  return new MemoryWaitExceptionStore(new Map<string, WaitException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitExceptionStore implements WaitExceptionStore {
  inner: WaitExceptionStore;
  cache: cache.TtlCache<WaitException>;
  hits: number;
  misses: number;

  constructor(inner: WaitExceptionStore, cacheValue: cache.TtlCache<WaitException>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitException | undefined {
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

  save(item: WaitException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitException[] {
    return this.inner.list();
  }
}

export function newCachedWaitExceptionStore(inner: WaitExceptionStore, ttl: number, clockValue: clock.Clock): WaitExceptionStore {
  return new CachedWaitExceptionStore(inner, cache.newTtlCache<WaitException>(1024, ttl, clockValue), 0, 0);
}

/** Selects wait exceptions. Empty fields match all. */
export class WaitExceptionQuery {
  title: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCost: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitException): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitException[]): WaitException[] {
    const matched = collections.filter(items, (candidate: WaitException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitExceptions(store: WaitExceptionStore, query: WaitExceptionQuery): WaitException[] {
  return query.apply(store.list());
}
