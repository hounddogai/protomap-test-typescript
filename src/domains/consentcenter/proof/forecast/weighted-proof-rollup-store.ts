import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedProofRollup } from "./weighted-proof-rollup.js";

/** Keeps weighted proof rollups by code. */
export interface WeightedProofRollupStore {
  find(code: string): WeightedProofRollup | undefined;
  save(item: WeightedProofRollup): void;
  remove(code: string): boolean;
  list(): WeightedProofRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedProofRollupStore implements WeightedProofRollupStore {
  items: Map<string, WeightedProofRollup>;
  order: string[];

  constructor(items: Map<string, WeightedProofRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedProofRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedProofRollup): void {
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

  list(): WeightedProofRollup[] {
    const out: WeightedProofRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedProofRollupStore(): WeightedProofRollupStore {
  return new MemoryWeightedProofRollupStore(new Map<string, WeightedProofRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedProofRollupStore implements WeightedProofRollupStore {
  inner: WeightedProofRollupStore;
  cache: cache.TtlCache<WeightedProofRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedProofRollupStore,
    cacheValue: cache.TtlCache<WeightedProofRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedProofRollup | undefined {
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

  save(item: WeightedProofRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedProofRollup[] {
    return this.inner.list();
  }
}

export function newCachedWeightedProofRollupStore(inner: WeightedProofRollupStore, ttl: number, clockValue: clock.Clock): WeightedProofRollupStore {
  return new CachedWeightedProofRollupStore(inner, cache.newTtlCache<WeightedProofRollup>(64, ttl, clockValue), 0, 0);
}

/** Selects weighted proof rollups. Empty fields match all. */
export class WeightedProofRollupQuery {
  unit: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minEndsAt: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedProofRollup): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedProofRollup[]): WeightedProofRollup[] {
    const matched = collections.filter(items, (candidate: WeightedProofRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedProofRollups(store: WeightedProofRollupStore, query: WeightedProofRollupQuery): WeightedProofRollup[] {
  return query.apply(store.list());
}
