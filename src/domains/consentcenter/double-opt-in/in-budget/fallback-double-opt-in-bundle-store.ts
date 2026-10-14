import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackDoubleOptInBundle } from "./fallback-double-opt-in-bundle.js";

/** Keeps fallback double opt in bundles by code. */
export interface FallbackDoubleOptInBundleStore {
  find(code: string): FallbackDoubleOptInBundle | undefined;
  save(item: FallbackDoubleOptInBundle): void;
  remove(code: string): boolean;
  list(): FallbackDoubleOptInBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackDoubleOptInBundleStore implements FallbackDoubleOptInBundleStore {
  items: Map<string, FallbackDoubleOptInBundle>;
  order: string[];

  constructor(items: Map<string, FallbackDoubleOptInBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackDoubleOptInBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackDoubleOptInBundle): void {
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

  list(): FallbackDoubleOptInBundle[] {
    const out: FallbackDoubleOptInBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackDoubleOptInBundleStore(): FallbackDoubleOptInBundleStore {
  return new MemoryFallbackDoubleOptInBundleStore(new Map<string, FallbackDoubleOptInBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackDoubleOptInBundleStore implements FallbackDoubleOptInBundleStore {
  inner: FallbackDoubleOptInBundleStore;
  cache: cache.TtlCache<FallbackDoubleOptInBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackDoubleOptInBundleStore,
    cacheValue: cache.TtlCache<FallbackDoubleOptInBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackDoubleOptInBundle | undefined {
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

  save(item: FallbackDoubleOptInBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackDoubleOptInBundle[] {
    return this.inner.list();
  }
}

export function newCachedFallbackDoubleOptInBundleStore(inner: FallbackDoubleOptInBundleStore, ttl: number, clockValue: clock.Clock): FallbackDoubleOptInBundleStore {
  return new CachedFallbackDoubleOptInBundleStore(
    inner,
    cache.newTtlCache<FallbackDoubleOptInBundle>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback double opt in bundles. Empty fields match all. */
export class FallbackDoubleOptInBundleQuery {
  locale: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minScore: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackDoubleOptInBundle): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackDoubleOptInBundle[]): FallbackDoubleOptInBundle[] {
    const matched = collections.filter(items, (candidate: FallbackDoubleOptInBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackDoubleOptInBundles(store: FallbackDoubleOptInBundleStore, query: FallbackDoubleOptInBundleQuery): FallbackDoubleOptInBundle[] {
  return query.apply(store.list());
}
