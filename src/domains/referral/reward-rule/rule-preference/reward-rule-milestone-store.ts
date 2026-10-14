import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleMilestone } from "./reward-rule-milestone.js";

/** Keeps reward rule milestones by code. */
export interface RewardRuleMilestoneStore {
  find(code: string): RewardRuleMilestone | undefined;
  save(item: RewardRuleMilestone): void;
  remove(code: string): boolean;
  list(): RewardRuleMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleMilestoneStore implements RewardRuleMilestoneStore {
  items: Map<string, RewardRuleMilestone>;
  order: string[];

  constructor(items: Map<string, RewardRuleMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleMilestone): void {
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

  list(): RewardRuleMilestone[] {
    const out: RewardRuleMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleMilestoneStore(): RewardRuleMilestoneStore {
  return new MemoryRewardRuleMilestoneStore(new Map<string, RewardRuleMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleMilestoneStore implements RewardRuleMilestoneStore {
  inner: RewardRuleMilestoneStore;
  cache: cache.TtlCache<RewardRuleMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleMilestoneStore,
    cacheValue: cache.TtlCache<RewardRuleMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleMilestone | undefined {
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

  save(item: RewardRuleMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleMilestone[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleMilestoneStore(inner: RewardRuleMilestoneStore, ttl: number, clockValue: clock.Clock): RewardRuleMilestoneStore {
  return new CachedRewardRuleMilestoneStore(inner, cache.newTtlCache<RewardRuleMilestone>(1024, ttl, clockValue), 0, 0);
}

/** Selects reward rule milestones. Empty fields match all. */
export class RewardRuleMilestoneQuery {
  channel: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleMilestone): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleMilestone[]): RewardRuleMilestone[] {
    const matched = collections.filter(items, (candidate: RewardRuleMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleMilestones(store: RewardRuleMilestoneStore, query: RewardRuleMilestoneQuery): RewardRuleMilestone[] {
  return query.apply(store.list());
}
