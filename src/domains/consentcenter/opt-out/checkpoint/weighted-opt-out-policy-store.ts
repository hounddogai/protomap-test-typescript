import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedOptOutPolicy } from "./weighted-opt-out-policy.js";

/** Keeps weighted opt out policies by code. */
export interface WeightedOptOutPolicyStore {
  find(code: string): WeightedOptOutPolicy | undefined;
  save(item: WeightedOptOutPolicy): void;
  remove(code: string): boolean;
  list(): WeightedOptOutPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedOptOutPolicyStore implements WeightedOptOutPolicyStore {
  items: Map<string, WeightedOptOutPolicy>;
  order: string[];

  constructor(items: Map<string, WeightedOptOutPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedOptOutPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedOptOutPolicy): void {
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

  list(): WeightedOptOutPolicy[] {
    const out: WeightedOptOutPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedOptOutPolicyStore(): WeightedOptOutPolicyStore {
  return new MemoryWeightedOptOutPolicyStore(new Map<string, WeightedOptOutPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedOptOutPolicyStore implements WeightedOptOutPolicyStore {
  inner: WeightedOptOutPolicyStore;
  cache: cache.TtlCache<WeightedOptOutPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedOptOutPolicyStore,
    cacheValue: cache.TtlCache<WeightedOptOutPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedOptOutPolicy | undefined {
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

  save(item: WeightedOptOutPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedOptOutPolicy[] {
    return this.inner.list();
  }
}

export function newCachedWeightedOptOutPolicyStore(inner: WeightedOptOutPolicyStore, ttl: number, clockValue: clock.Clock): WeightedOptOutPolicyStore {
  return new CachedWeightedOptOutPolicyStore(
    inner,
    cache.newTtlCache<WeightedOptOutPolicy>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted opt out policies. Empty fields match all. */
export class WeightedOptOutPolicyQuery {
  unit: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedOptOutPolicy): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedOptOutPolicy[]): WeightedOptOutPolicy[] {
    const matched = collections.filter(items, (candidate: WeightedOptOutPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedOptOutPolicies(store: WeightedOptOutPolicyStore, query: WeightedOptOutPolicyQuery): WeightedOptOutPolicy[] {
  return query.apply(store.list());
}
