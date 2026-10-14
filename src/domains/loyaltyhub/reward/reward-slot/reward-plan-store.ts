import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardPlan } from "./reward-plan.js";

/** Keeps reward plans by code. */
export interface RewardPlanStore {
  find(code: string): RewardPlan | undefined;
  save(item: RewardPlan): void;
  remove(code: string): boolean;
  list(): RewardPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardPlanStore implements RewardPlanStore {
  items: Map<string, RewardPlan>;
  order: string[];

  constructor(items: Map<string, RewardPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardPlan): void {
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

  list(): RewardPlan[] {
    const out: RewardPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardPlanStore(): RewardPlanStore {
  return new MemoryRewardPlanStore(new Map<string, RewardPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardPlanStore implements RewardPlanStore {
  inner: RewardPlanStore;
  cache: cache.TtlCache<RewardPlan>;
  hits: number;
  misses: number;

  constructor(inner: RewardPlanStore, cacheValue: cache.TtlCache<RewardPlan>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardPlan | undefined {
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

  save(item: RewardPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardPlan[] {
    return this.inner.list();
  }
}

export function newCachedRewardPlanStore(inner: RewardPlanStore, ttl: number, clockValue: clock.Clock): RewardPlanStore {
  return new CachedRewardPlanStore(inner, cache.newTtlCache<RewardPlan>(512, ttl, clockValue), 0, 0);
}

/** Selects reward plans. Empty fields match all. */
export class RewardPlanQuery {
  channel: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardPlan): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardPlan[]): RewardPlan[] {
    const matched = collections.filter(items, (candidate: RewardPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardPlans(store: RewardPlanStore, query: RewardPlanQuery): RewardPlan[] {
  return query.apply(store.list());
}
