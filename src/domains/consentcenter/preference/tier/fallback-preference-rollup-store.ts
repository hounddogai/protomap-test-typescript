import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackPreferenceRollup } from "./fallback-preference-rollup.js";

/** Keeps fallback preference rollups by code. */
export interface FallbackPreferenceRollupStore {
  find(code: string): FallbackPreferenceRollup | undefined;
  save(item: FallbackPreferenceRollup): void;
  remove(code: string): boolean;
  list(): FallbackPreferenceRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackPreferenceRollupStore implements FallbackPreferenceRollupStore {
  items: Map<string, FallbackPreferenceRollup>;
  order: string[];

  constructor(items: Map<string, FallbackPreferenceRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackPreferenceRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackPreferenceRollup): void {
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

  list(): FallbackPreferenceRollup[] {
    const out: FallbackPreferenceRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackPreferenceRollupStore(): FallbackPreferenceRollupStore {
  return new MemoryFallbackPreferenceRollupStore(new Map<string, FallbackPreferenceRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackPreferenceRollupStore implements FallbackPreferenceRollupStore {
  inner: FallbackPreferenceRollupStore;
  cache: cache.TtlCache<FallbackPreferenceRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackPreferenceRollupStore,
    cacheValue: cache.TtlCache<FallbackPreferenceRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackPreferenceRollup | undefined {
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

  save(item: FallbackPreferenceRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackPreferenceRollup[] {
    return this.inner.list();
  }
}

export function newCachedFallbackPreferenceRollupStore(inner: FallbackPreferenceRollupStore, ttl: number, clockValue: clock.Clock): FallbackPreferenceRollupStore {
  return new CachedFallbackPreferenceRollupStore(
    inner,
    cache.newTtlCache<FallbackPreferenceRollup>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback preference rollups. Empty fields match all. */
export class FallbackPreferenceRollupQuery {
  country: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minBudget: number, statuses: string[], limit: number) {
    this.country = country;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackPreferenceRollup): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackPreferenceRollup[]): FallbackPreferenceRollup[] {
    const matched = collections.filter(items, (candidate: FallbackPreferenceRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackPreferenceRollups(store: FallbackPreferenceRollupStore, query: FallbackPreferenceRollupQuery): FallbackPreferenceRollup[] {
  return query.apply(store.list());
}
