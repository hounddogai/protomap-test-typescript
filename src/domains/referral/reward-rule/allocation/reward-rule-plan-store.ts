import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRulePlan } from "./reward-rule-plan.js";

/** Keeps reward rule plans by code. */
export interface RewardRulePlanStore {
  find(code: string): RewardRulePlan | undefined;
  save(item: RewardRulePlan): void;
  remove(code: string): boolean;
  list(): RewardRulePlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRulePlanStore implements RewardRulePlanStore {
  items: Map<string, RewardRulePlan>;
  order: string[];

  constructor(items: Map<string, RewardRulePlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRulePlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRulePlan): void {
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

  list(): RewardRulePlan[] {
    const out: RewardRulePlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRulePlanStore(): RewardRulePlanStore {
  return new MemoryRewardRulePlanStore(new Map<string, RewardRulePlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRulePlanStore implements RewardRulePlanStore {
  inner: RewardRulePlanStore;
  cache: cache.TtlCache<RewardRulePlan>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRulePlanStore,
    cacheValue: cache.TtlCache<RewardRulePlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRulePlan | undefined {
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

  save(item: RewardRulePlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRulePlan[] {
    return this.inner.list();
  }
}

export function newCachedRewardRulePlanStore(inner: RewardRulePlanStore, ttl: number, clockValue: clock.Clock): RewardRulePlanStore {
  return new CachedRewardRulePlanStore(inner, cache.newTtlCache<RewardRulePlan>(128, ttl, clockValue), 0, 0);
}

/** Selects reward rule plans. Empty fields match all. */
export class RewardRulePlanQuery {
  title: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMargin: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRulePlan): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRulePlan[]): RewardRulePlan[] {
    const matched = collections.filter(items, (candidate: RewardRulePlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRulePlans(store: RewardRulePlanStore, query: RewardRulePlanQuery): RewardRulePlan[] {
  return query.apply(store.list());
}
