import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitBundle } from "./wait-bundle.js";

/** Keeps wait bundles by code. */
export interface WaitBundleStore {
  find(code: string): WaitBundle | undefined;
  save(item: WaitBundle): void;
  remove(code: string): boolean;
  list(): WaitBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitBundleStore implements WaitBundleStore {
  items: Map<string, WaitBundle>;
  order: string[];

  constructor(items: Map<string, WaitBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitBundle): void {
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

  list(): WaitBundle[] {
    const out: WaitBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitBundleStore(): WaitBundleStore {
  return new MemoryWaitBundleStore(new Map<string, WaitBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitBundleStore implements WaitBundleStore {
  inner: WaitBundleStore;
  cache: cache.TtlCache<WaitBundle>;
  hits: number;
  misses: number;

  constructor(inner: WaitBundleStore, cacheValue: cache.TtlCache<WaitBundle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitBundle | undefined {
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

  save(item: WaitBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitBundle[] {
    return this.inner.list();
  }
}

export function newCachedWaitBundleStore(inner: WaitBundleStore, ttl: number, clockValue: clock.Clock): WaitBundleStore {
  return new CachedWaitBundleStore(inner, cache.newTtlCache<WaitBundle>(64, ttl, clockValue), 0, 0);
}

/** Selects wait bundles. Empty fields match all. */
export class WaitBundleQuery {
  name: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBid: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitBundle): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitBundle[]): WaitBundle[] {
    const matched = collections.filter(items, (candidate: WaitBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitBundles(store: WaitBundleStore, query: WaitBundleQuery): WaitBundle[] {
  return query.apply(store.list());
}
