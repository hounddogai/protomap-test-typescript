import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackStreakBundle } from "./fallback-streak-bundle.js";

/** Keeps fallback streak bundles by code. */
export interface FallbackStreakBundleStore {
  find(code: string): FallbackStreakBundle | undefined;
  save(item: FallbackStreakBundle): void;
  remove(code: string): boolean;
  list(): FallbackStreakBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackStreakBundleStore implements FallbackStreakBundleStore {
  items: Map<string, FallbackStreakBundle>;
  order: string[];

  constructor(items: Map<string, FallbackStreakBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackStreakBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackStreakBundle): void {
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

  list(): FallbackStreakBundle[] {
    const out: FallbackStreakBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackStreakBundleStore(): FallbackStreakBundleStore {
  return new MemoryFallbackStreakBundleStore(new Map<string, FallbackStreakBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackStreakBundleStore implements FallbackStreakBundleStore {
  inner: FallbackStreakBundleStore;
  cache: cache.TtlCache<FallbackStreakBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackStreakBundleStore,
    cacheValue: cache.TtlCache<FallbackStreakBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackStreakBundle | undefined {
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

  save(item: FallbackStreakBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackStreakBundle[] {
    return this.inner.list();
  }
}

export function newCachedFallbackStreakBundleStore(inner: FallbackStreakBundleStore, ttl: number, clockValue: clock.Clock): FallbackStreakBundleStore {
  return new CachedFallbackStreakBundleStore(
    inner,
    cache.newTtlCache<FallbackStreakBundle>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback streak bundles. Empty fields match all. */
export class FallbackStreakBundleQuery {
  segment: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minBid: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackStreakBundle): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackStreakBundle[]): FallbackStreakBundle[] {
    const matched = collections.filter(items, (candidate: FallbackStreakBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackStreakBundles(store: FallbackStreakBundleStore, query: FallbackStreakBundleQuery): FallbackStreakBundle[] {
  return query.apply(store.list());
}
