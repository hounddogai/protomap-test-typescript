import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackOptOutBundle } from "./fallback-opt-out-bundle.js";

/** Keeps fallback opt out bundles by code. */
export interface FallbackOptOutBundleStore {
  find(code: string): FallbackOptOutBundle | undefined;
  save(item: FallbackOptOutBundle): void;
  remove(code: string): boolean;
  list(): FallbackOptOutBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackOptOutBundleStore implements FallbackOptOutBundleStore {
  items: Map<string, FallbackOptOutBundle>;
  order: string[];

  constructor(items: Map<string, FallbackOptOutBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackOptOutBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackOptOutBundle): void {
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

  list(): FallbackOptOutBundle[] {
    const out: FallbackOptOutBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackOptOutBundleStore(): FallbackOptOutBundleStore {
  return new MemoryFallbackOptOutBundleStore(new Map<string, FallbackOptOutBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackOptOutBundleStore implements FallbackOptOutBundleStore {
  inner: FallbackOptOutBundleStore;
  cache: cache.TtlCache<FallbackOptOutBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackOptOutBundleStore,
    cacheValue: cache.TtlCache<FallbackOptOutBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackOptOutBundle | undefined {
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

  save(item: FallbackOptOutBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackOptOutBundle[] {
    return this.inner.list();
  }
}

export function newCachedFallbackOptOutBundleStore(inner: FallbackOptOutBundleStore, ttl: number, clockValue: clock.Clock): FallbackOptOutBundleStore {
  return new CachedFallbackOptOutBundleStore(
    inner,
    cache.newTtlCache<FallbackOptOutBundle>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback opt out bundles. Empty fields match all. */
export class FallbackOptOutBundleQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackOptOutBundle): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackOptOutBundle[]): FallbackOptOutBundle[] {
    const matched = collections.filter(items, (candidate: FallbackOptOutBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackOptOutBundles(store: FallbackOptOutBundleStore, query: FallbackOptOutBundleQuery): FallbackOptOutBundle[] {
  return query.apply(store.list());
}
