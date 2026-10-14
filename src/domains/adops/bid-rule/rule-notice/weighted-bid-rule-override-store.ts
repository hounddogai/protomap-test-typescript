import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedBidRuleOverride } from "./weighted-bid-rule-override.js";

/** Keeps weighted bid rule overrides by code. */
export interface WeightedBidRuleOverrideStore {
  find(code: string): WeightedBidRuleOverride | undefined;
  save(item: WeightedBidRuleOverride): void;
  remove(code: string): boolean;
  list(): WeightedBidRuleOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedBidRuleOverrideStore implements WeightedBidRuleOverrideStore {
  items: Map<string, WeightedBidRuleOverride>;
  order: string[];

  constructor(items: Map<string, WeightedBidRuleOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedBidRuleOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedBidRuleOverride): void {
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

  list(): WeightedBidRuleOverride[] {
    const out: WeightedBidRuleOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedBidRuleOverrideStore(): WeightedBidRuleOverrideStore {
  return new MemoryWeightedBidRuleOverrideStore(new Map<string, WeightedBidRuleOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedBidRuleOverrideStore implements WeightedBidRuleOverrideStore {
  inner: WeightedBidRuleOverrideStore;
  cache: cache.TtlCache<WeightedBidRuleOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedBidRuleOverrideStore,
    cacheValue: cache.TtlCache<WeightedBidRuleOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedBidRuleOverride | undefined {
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

  save(item: WeightedBidRuleOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedBidRuleOverride[] {
    return this.inner.list();
  }
}

export function newCachedWeightedBidRuleOverrideStore(inner: WeightedBidRuleOverrideStore, ttl: number, clockValue: clock.Clock): WeightedBidRuleOverrideStore {
  return new CachedWeightedBidRuleOverrideStore(
    inner,
    cache.newTtlCache<WeightedBidRuleOverride>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted bid rule overrides. Empty fields match all. */
export class WeightedBidRuleOverrideQuery {
  label: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAmount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedBidRuleOverride): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedBidRuleOverride[]): WeightedBidRuleOverride[] {
    const matched = collections.filter(items, (candidate: WeightedBidRuleOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedBidRuleOverrides(store: WeightedBidRuleOverrideStore, query: WeightedBidRuleOverrideQuery): WeightedBidRuleOverride[] {
  return query.apply(store.list());
}
