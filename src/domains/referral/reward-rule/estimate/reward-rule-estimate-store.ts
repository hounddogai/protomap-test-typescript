import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleEstimate } from "./reward-rule-estimate.js";

/** Keeps reward rule estimates by code. */
export interface RewardRuleEstimateStore {
  find(code: string): RewardRuleEstimate | undefined;
  save(item: RewardRuleEstimate): void;
  remove(code: string): boolean;
  list(): RewardRuleEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleEstimateStore implements RewardRuleEstimateStore {
  items: Map<string, RewardRuleEstimate>;
  order: string[];

  constructor(items: Map<string, RewardRuleEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleEstimate): void {
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

  list(): RewardRuleEstimate[] {
    const out: RewardRuleEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleEstimateStore(): RewardRuleEstimateStore {
  return new MemoryRewardRuleEstimateStore(new Map<string, RewardRuleEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleEstimateStore implements RewardRuleEstimateStore {
  inner: RewardRuleEstimateStore;
  cache: cache.TtlCache<RewardRuleEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleEstimateStore,
    cacheValue: cache.TtlCache<RewardRuleEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleEstimate | undefined {
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

  save(item: RewardRuleEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleEstimate[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleEstimateStore(inner: RewardRuleEstimateStore, ttl: number, clockValue: clock.Clock): RewardRuleEstimateStore {
  return new CachedRewardRuleEstimateStore(inner, cache.newTtlCache<RewardRuleEstimate>(1024, ttl, clockValue), 0, 0);
}

/** Selects reward rule estimates. Empty fields match all. */
export class RewardRuleEstimateQuery {
  name: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMaximum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleEstimate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleEstimate[]): RewardRuleEstimate[] {
    const matched = collections.filter(items, (candidate: RewardRuleEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleEstimates(store: RewardRuleEstimateStore, query: RewardRuleEstimateQuery): RewardRuleEstimate[] {
  return query.apply(store.list());
}
