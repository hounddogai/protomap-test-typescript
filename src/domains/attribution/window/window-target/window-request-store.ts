import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowRequest } from "./window-request.js";

/** Keeps window requests by code. */
export interface WindowRequestStore {
  find(code: string): WindowRequest | undefined;
  save(item: WindowRequest): void;
  remove(code: string): boolean;
  list(): WindowRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowRequestStore implements WindowRequestStore {
  items: Map<string, WindowRequest>;
  order: string[];

  constructor(items: Map<string, WindowRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowRequest): void {
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

  list(): WindowRequest[] {
    const out: WindowRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowRequestStore(): WindowRequestStore {
  return new MemoryWindowRequestStore(new Map<string, WindowRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowRequestStore implements WindowRequestStore {
  inner: WindowRequestStore;
  cache: cache.TtlCache<WindowRequest>;
  hits: number;
  misses: number;

  constructor(inner: WindowRequestStore, cacheValue: cache.TtlCache<WindowRequest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowRequest | undefined {
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

  save(item: WindowRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowRequest[] {
    return this.inner.list();
  }
}

export function newCachedWindowRequestStore(inner: WindowRequestStore, ttl: number, clockValue: clock.Clock): WindowRequestStore {
  return new CachedWindowRequestStore(inner, cache.newTtlCache<WindowRequest>(128, ttl, clockValue), 0, 0);
}

/** Selects window requests. Empty fields match all. */
export class WindowRequestQuery {
  title: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBudget: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WindowRequest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowRequest[]): WindowRequest[] {
    const matched = collections.filter(items, (candidate: WindowRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowRequests(store: WindowRequestStore, query: WindowRequestQuery): WindowRequest[] {
  return query.apply(store.list());
}
