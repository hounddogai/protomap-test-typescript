import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakBundle } from "./streak-bundle.js";

/** Keeps streak bundles by code. */
export interface StreakBundleStore {
  find(code: string): StreakBundle | undefined;
  save(item: StreakBundle): void;
  remove(code: string): boolean;
  list(): StreakBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakBundleStore implements StreakBundleStore {
  items: Map<string, StreakBundle>;
  order: string[];

  constructor(items: Map<string, StreakBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakBundle): void {
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

  list(): StreakBundle[] {
    const out: StreakBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakBundleStore(): StreakBundleStore {
  return new MemoryStreakBundleStore(new Map<string, StreakBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakBundleStore implements StreakBundleStore {
  inner: StreakBundleStore;
  cache: cache.TtlCache<StreakBundle>;
  hits: number;
  misses: number;

  constructor(inner: StreakBundleStore, cacheValue: cache.TtlCache<StreakBundle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakBundle | undefined {
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

  save(item: StreakBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakBundle[] {
    return this.inner.list();
  }
}

export function newCachedStreakBundleStore(inner: StreakBundleStore, ttl: number, clockValue: clock.Clock): StreakBundleStore {
  return new CachedStreakBundleStore(inner, cache.newTtlCache<StreakBundle>(1024, ttl, clockValue), 0, 0);
}

/** Selects streak bundles. Empty fields match all. */
export class StreakBundleQuery {
  country: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakBundle): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakBundle[]): StreakBundle[] {
    const matched = collections.filter(items, (candidate: StreakBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakBundles(store: StreakBundleStore, query: StreakBundleQuery): StreakBundle[] {
  return query.apply(store.list());
}
