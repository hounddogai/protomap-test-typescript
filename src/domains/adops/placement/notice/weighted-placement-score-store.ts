import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedPlacementScore } from "./weighted-placement-score.js";

/** Keeps weighted placement scores by code. */
export interface WeightedPlacementScoreStore {
  find(code: string): WeightedPlacementScore | undefined;
  save(item: WeightedPlacementScore): void;
  remove(code: string): boolean;
  list(): WeightedPlacementScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedPlacementScoreStore implements WeightedPlacementScoreStore {
  items: Map<string, WeightedPlacementScore>;
  order: string[];

  constructor(items: Map<string, WeightedPlacementScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedPlacementScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedPlacementScore): void {
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

  list(): WeightedPlacementScore[] {
    const out: WeightedPlacementScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedPlacementScoreStore(): WeightedPlacementScoreStore {
  return new MemoryWeightedPlacementScoreStore(new Map<string, WeightedPlacementScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedPlacementScoreStore implements WeightedPlacementScoreStore {
  inner: WeightedPlacementScoreStore;
  cache: cache.TtlCache<WeightedPlacementScore>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedPlacementScoreStore,
    cacheValue: cache.TtlCache<WeightedPlacementScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedPlacementScore | undefined {
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

  save(item: WeightedPlacementScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedPlacementScore[] {
    return this.inner.list();
  }
}

export function newCachedWeightedPlacementScoreStore(inner: WeightedPlacementScoreStore, ttl: number, clockValue: clock.Clock): WeightedPlacementScoreStore {
  return new CachedWeightedPlacementScoreStore(
    inner,
    cache.newTtlCache<WeightedPlacementScore>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted placement scores. Empty fields match all. */
export class WeightedPlacementScoreQuery {
  country: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minQuantity: number, statuses: string[], limit: number) {
    this.country = country;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedPlacementScore): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedPlacementScore[]): WeightedPlacementScore[] {
    const matched = collections.filter(items, (candidate: WeightedPlacementScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedPlacementScores(store: WeightedPlacementScoreStore, query: WeightedPlacementScoreQuery): WeightedPlacementScore[] {
  return query.apply(store.list());
}
