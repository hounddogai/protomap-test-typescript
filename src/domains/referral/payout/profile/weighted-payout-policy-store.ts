import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedPayoutPolicy } from "./weighted-payout-policy.js";

/** Keeps weighted payout policies by code. */
export interface WeightedPayoutPolicyStore {
  find(code: string): WeightedPayoutPolicy | undefined;
  save(item: WeightedPayoutPolicy): void;
  remove(code: string): boolean;
  list(): WeightedPayoutPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedPayoutPolicyStore implements WeightedPayoutPolicyStore {
  items: Map<string, WeightedPayoutPolicy>;
  order: string[];

  constructor(items: Map<string, WeightedPayoutPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedPayoutPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedPayoutPolicy): void {
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

  list(): WeightedPayoutPolicy[] {
    const out: WeightedPayoutPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedPayoutPolicyStore(): WeightedPayoutPolicyStore {
  return new MemoryWeightedPayoutPolicyStore(new Map<string, WeightedPayoutPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedPayoutPolicyStore implements WeightedPayoutPolicyStore {
  inner: WeightedPayoutPolicyStore;
  cache: cache.TtlCache<WeightedPayoutPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedPayoutPolicyStore,
    cacheValue: cache.TtlCache<WeightedPayoutPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedPayoutPolicy | undefined {
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

  save(item: WeightedPayoutPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedPayoutPolicy[] {
    return this.inner.list();
  }
}

export function newCachedWeightedPayoutPolicyStore(inner: WeightedPayoutPolicyStore, ttl: number, clockValue: clock.Clock): WeightedPayoutPolicyStore {
  return new CachedWeightedPayoutPolicyStore(
    inner,
    cache.newTtlCache<WeightedPayoutPolicy>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted payout policies. Empty fields match all. */
export class WeightedPayoutPolicyQuery {
  title: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minWindowDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedPayoutPolicy): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedPayoutPolicy[]): WeightedPayoutPolicy[] {
    const matched = collections.filter(items, (candidate: WeightedPayoutPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedPayoutPolicies(store: WeightedPayoutPolicyStore, query: WeightedPayoutPolicyQuery): WeightedPayoutPolicy[] {
  return query.apply(store.list());
}
