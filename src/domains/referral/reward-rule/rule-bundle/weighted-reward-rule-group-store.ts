import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedRewardRuleGroup } from "./weighted-reward-rule-group.js";

/** Keeps weighted reward rule groups by code. */
export interface WeightedRewardRuleGroupStore {
  find(code: string): WeightedRewardRuleGroup | undefined;
  save(item: WeightedRewardRuleGroup): void;
  remove(code: string): boolean;
  list(): WeightedRewardRuleGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedRewardRuleGroupStore implements WeightedRewardRuleGroupStore {
  items: Map<string, WeightedRewardRuleGroup>;
  order: string[];

  constructor(items: Map<string, WeightedRewardRuleGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedRewardRuleGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedRewardRuleGroup): void {
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

  list(): WeightedRewardRuleGroup[] {
    const out: WeightedRewardRuleGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedRewardRuleGroupStore(): WeightedRewardRuleGroupStore {
  return new MemoryWeightedRewardRuleGroupStore(new Map<string, WeightedRewardRuleGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedRewardRuleGroupStore implements WeightedRewardRuleGroupStore {
  inner: WeightedRewardRuleGroupStore;
  cache: cache.TtlCache<WeightedRewardRuleGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedRewardRuleGroupStore,
    cacheValue: cache.TtlCache<WeightedRewardRuleGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedRewardRuleGroup | undefined {
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

  save(item: WeightedRewardRuleGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedRewardRuleGroup[] {
    return this.inner.list();
  }
}

export function newCachedWeightedRewardRuleGroupStore(inner: WeightedRewardRuleGroupStore, ttl: number, clockValue: clock.Clock): WeightedRewardRuleGroupStore {
  return new CachedWeightedRewardRuleGroupStore(
    inner,
    cache.newTtlCache<WeightedRewardRuleGroup>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted reward rule groups. Empty fields match all. */
export class WeightedRewardRuleGroupQuery {
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

  matches(item: WeightedRewardRuleGroup): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedRewardRuleGroup[]): WeightedRewardRuleGroup[] {
    const matched = collections.filter(items, (candidate: WeightedRewardRuleGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedRewardRuleGroups(store: WeightedRewardRuleGroupStore, query: WeightedRewardRuleGroupQuery): WeightedRewardRuleGroup[] {
  return query.apply(store.list());
}
