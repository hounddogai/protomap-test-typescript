import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredPostRollup } from "./tiered-post-rollup.js";

/** Keeps tiered post rollups by code. */
export interface TieredPostRollupStore {
  find(code: string): TieredPostRollup | undefined;
  save(item: TieredPostRollup): void;
  remove(code: string): boolean;
  list(): TieredPostRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredPostRollupStore implements TieredPostRollupStore {
  items: Map<string, TieredPostRollup>;
  order: string[];

  constructor(items: Map<string, TieredPostRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredPostRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredPostRollup): void {
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

  list(): TieredPostRollup[] {
    const out: TieredPostRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredPostRollupStore(): TieredPostRollupStore {
  return new MemoryTieredPostRollupStore(new Map<string, TieredPostRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredPostRollupStore implements TieredPostRollupStore {
  inner: TieredPostRollupStore;
  cache: cache.TtlCache<TieredPostRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredPostRollupStore,
    cacheValue: cache.TtlCache<TieredPostRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredPostRollup | undefined {
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

  save(item: TieredPostRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredPostRollup[] {
    return this.inner.list();
  }
}

export function newCachedTieredPostRollupStore(inner: TieredPostRollupStore, ttl: number, clockValue: clock.Clock): TieredPostRollupStore {
  return new CachedTieredPostRollupStore(inner, cache.newTtlCache<TieredPostRollup>(128, ttl, clockValue), 0, 0);
}

/** Selects tiered post rollups. Empty fields match all. */
export class TieredPostRollupQuery {
  source: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minImpressions: number, statuses: string[], limit: number) {
    this.source = source;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredPostRollup): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredPostRollup[]): TieredPostRollup[] {
    const matched = collections.filter(items, (candidate: TieredPostRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredPostRollups(store: TieredPostRollupStore, query: TieredPostRollupQuery): TieredPostRollup[] {
  return query.apply(store.list());
}
