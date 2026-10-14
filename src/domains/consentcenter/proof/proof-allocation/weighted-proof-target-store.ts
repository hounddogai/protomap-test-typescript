import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedProofTarget } from "./weighted-proof-target.js";

/** Keeps weighted proof targets by code. */
export interface WeightedProofTargetStore {
  find(code: string): WeightedProofTarget | undefined;
  save(item: WeightedProofTarget): void;
  remove(code: string): boolean;
  list(): WeightedProofTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedProofTargetStore implements WeightedProofTargetStore {
  items: Map<string, WeightedProofTarget>;
  order: string[];

  constructor(items: Map<string, WeightedProofTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedProofTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedProofTarget): void {
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

  list(): WeightedProofTarget[] {
    const out: WeightedProofTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedProofTargetStore(): WeightedProofTargetStore {
  return new MemoryWeightedProofTargetStore(new Map<string, WeightedProofTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedProofTargetStore implements WeightedProofTargetStore {
  inner: WeightedProofTargetStore;
  cache: cache.TtlCache<WeightedProofTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedProofTargetStore,
    cacheValue: cache.TtlCache<WeightedProofTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedProofTarget | undefined {
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

  save(item: WeightedProofTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedProofTarget[] {
    return this.inner.list();
  }
}

export function newCachedWeightedProofTargetStore(inner: WeightedProofTargetStore, ttl: number, clockValue: clock.Clock): WeightedProofTargetStore {
  return new CachedWeightedProofTargetStore(inner, cache.newTtlCache<WeightedProofTarget>(256, ttl, clockValue), 0, 0);
}

/** Selects weighted proof targets. Empty fields match all. */
export class WeightedProofTargetQuery {
  segment: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minBudget: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedProofTarget): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedProofTarget[]): WeightedProofTarget[] {
    const matched = collections.filter(items, (candidate: WeightedProofTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedProofTargets(store: WeightedProofTargetStore, query: WeightedProofTargetQuery): WeightedProofTarget[] {
  return query.apply(store.list());
}
