import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalRewardRuleRollup } from "./global-reward-rule-rollup.js";

/** Keeps global reward rule rollups by code. */
export interface GlobalRewardRuleRollupStore {
  find(code: string): GlobalRewardRuleRollup | undefined;
  save(item: GlobalRewardRuleRollup): void;
  remove(code: string): boolean;
  list(): GlobalRewardRuleRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalRewardRuleRollupStore implements GlobalRewardRuleRollupStore {
  items: Map<string, GlobalRewardRuleRollup>;
  order: string[];

  constructor(items: Map<string, GlobalRewardRuleRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalRewardRuleRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalRewardRuleRollup): void {
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

  list(): GlobalRewardRuleRollup[] {
    const out: GlobalRewardRuleRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalRewardRuleRollupStore(): GlobalRewardRuleRollupStore {
  return new MemoryGlobalRewardRuleRollupStore(new Map<string, GlobalRewardRuleRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalRewardRuleRollupStore implements GlobalRewardRuleRollupStore {
  inner: GlobalRewardRuleRollupStore;
  cache: cache.TtlCache<GlobalRewardRuleRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalRewardRuleRollupStore,
    cacheValue: cache.TtlCache<GlobalRewardRuleRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalRewardRuleRollup | undefined {
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

  save(item: GlobalRewardRuleRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalRewardRuleRollup[] {
    return this.inner.list();
  }
}

export function newCachedGlobalRewardRuleRollupStore(inner: GlobalRewardRuleRollupStore, ttl: number, clockValue: clock.Clock): GlobalRewardRuleRollupStore {
  return new CachedGlobalRewardRuleRollupStore(
    inner,
    cache.newTtlCache<GlobalRewardRuleRollup>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global reward rule rollups. Empty fields match all. */
export class GlobalRewardRuleRollupQuery {
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

  matches(item: GlobalRewardRuleRollup): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalRewardRuleRollup[]): GlobalRewardRuleRollup[] {
    const matched = collections.filter(items, (candidate: GlobalRewardRuleRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalRewardRuleRollups(store: GlobalRewardRuleRollupStore, query: GlobalRewardRuleRollupQuery): GlobalRewardRuleRollup[] {
  return query.apply(store.list());
}
