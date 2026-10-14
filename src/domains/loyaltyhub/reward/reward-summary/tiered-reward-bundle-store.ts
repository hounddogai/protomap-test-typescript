import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredRewardBundle } from "./tiered-reward-bundle.js";

/** Keeps tiered reward bundles by code. */
export interface TieredRewardBundleStore {
  find(code: string): TieredRewardBundle | undefined;
  save(item: TieredRewardBundle): void;
  remove(code: string): boolean;
  list(): TieredRewardBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredRewardBundleStore implements TieredRewardBundleStore {
  items: Map<string, TieredRewardBundle>;
  order: string[];

  constructor(items: Map<string, TieredRewardBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredRewardBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredRewardBundle): void {
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

  list(): TieredRewardBundle[] {
    const out: TieredRewardBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredRewardBundleStore(): TieredRewardBundleStore {
  return new MemoryTieredRewardBundleStore(new Map<string, TieredRewardBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredRewardBundleStore implements TieredRewardBundleStore {
  inner: TieredRewardBundleStore;
  cache: cache.TtlCache<TieredRewardBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredRewardBundleStore,
    cacheValue: cache.TtlCache<TieredRewardBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredRewardBundle | undefined {
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

  save(item: TieredRewardBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredRewardBundle[] {
    return this.inner.list();
  }
}

export function newCachedTieredRewardBundleStore(inner: TieredRewardBundleStore, ttl: number, clockValue: clock.Clock): TieredRewardBundleStore {
  return new CachedTieredRewardBundleStore(inner, cache.newTtlCache<TieredRewardBundle>(256, ttl, clockValue), 0, 0);
}

/** Selects tiered reward bundles. Empty fields match all. */
export class TieredRewardBundleQuery {
  category: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minEndsAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredRewardBundle): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredRewardBundle[]): TieredRewardBundle[] {
    const matched = collections.filter(items, (candidate: TieredRewardBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredRewardBundles(store: TieredRewardBundleStore, query: TieredRewardBundleQuery): TieredRewardBundle[] {
  return query.apply(store.list());
}
