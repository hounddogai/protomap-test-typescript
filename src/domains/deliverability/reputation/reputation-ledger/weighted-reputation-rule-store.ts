import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedReputationRule } from "./weighted-reputation-rule.js";

/** Keeps weighted reputation rules by code. */
export interface WeightedReputationRuleStore {
  find(code: string): WeightedReputationRule | undefined;
  save(item: WeightedReputationRule): void;
  remove(code: string): boolean;
  list(): WeightedReputationRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedReputationRuleStore implements WeightedReputationRuleStore {
  items: Map<string, WeightedReputationRule>;
  order: string[];

  constructor(items: Map<string, WeightedReputationRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedReputationRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedReputationRule): void {
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

  list(): WeightedReputationRule[] {
    const out: WeightedReputationRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedReputationRuleStore(): WeightedReputationRuleStore {
  return new MemoryWeightedReputationRuleStore(new Map<string, WeightedReputationRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedReputationRuleStore implements WeightedReputationRuleStore {
  inner: WeightedReputationRuleStore;
  cache: cache.TtlCache<WeightedReputationRule>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedReputationRuleStore,
    cacheValue: cache.TtlCache<WeightedReputationRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedReputationRule | undefined {
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

  save(item: WeightedReputationRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedReputationRule[] {
    return this.inner.list();
  }
}

export function newCachedWeightedReputationRuleStore(inner: WeightedReputationRuleStore, ttl: number, clockValue: clock.Clock): WeightedReputationRuleStore {
  return new CachedWeightedReputationRuleStore(
    inner,
    cache.newTtlCache<WeightedReputationRule>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted reputation rules. Empty fields match all. */
export class WeightedReputationRuleQuery {
  name: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minStartsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedReputationRule): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedReputationRule[]): WeightedReputationRule[] {
    const matched = collections.filter(items, (candidate: WeightedReputationRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedReputationRules(store: WeightedReputationRuleStore, query: WeightedReputationRuleQuery): WeightedReputationRule[] {
  return query.apply(store.list());
}
