import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalFlightBundle } from "./global-flight-bundle.js";

/** Keeps global flight bundles by code. */
export interface GlobalFlightBundleStore {
  find(code: string): GlobalFlightBundle | undefined;
  save(item: GlobalFlightBundle): void;
  remove(code: string): boolean;
  list(): GlobalFlightBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalFlightBundleStore implements GlobalFlightBundleStore {
  items: Map<string, GlobalFlightBundle>;
  order: string[];

  constructor(items: Map<string, GlobalFlightBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalFlightBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalFlightBundle): void {
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

  list(): GlobalFlightBundle[] {
    const out: GlobalFlightBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalFlightBundleStore(): GlobalFlightBundleStore {
  return new MemoryGlobalFlightBundleStore(new Map<string, GlobalFlightBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalFlightBundleStore implements GlobalFlightBundleStore {
  inner: GlobalFlightBundleStore;
  cache: cache.TtlCache<GlobalFlightBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalFlightBundleStore,
    cacheValue: cache.TtlCache<GlobalFlightBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalFlightBundle | undefined {
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

  save(item: GlobalFlightBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalFlightBundle[] {
    return this.inner.list();
  }
}

export function newCachedGlobalFlightBundleStore(inner: GlobalFlightBundleStore, ttl: number, clockValue: clock.Clock): GlobalFlightBundleStore {
  return new CachedGlobalFlightBundleStore(inner, cache.newTtlCache<GlobalFlightBundle>(128, ttl, clockValue), 0, 0);
}

/** Selects global flight bundles. Empty fields match all. */
export class GlobalFlightBundleQuery {
  category: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minSendAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalFlightBundle): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalFlightBundle[]): GlobalFlightBundle[] {
    const matched = collections.filter(items, (candidate: GlobalFlightBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalFlightBundles(store: GlobalFlightBundleStore, query: GlobalFlightBundleQuery): GlobalFlightBundle[] {
  return query.apply(store.list());
}
