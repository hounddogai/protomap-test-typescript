import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRulePolicy } from "./reward-rule-policy.js";

/** Keeps reward rule policies by code. */
export interface RewardRulePolicyStore {
  find(code: string): RewardRulePolicy | undefined;
  save(item: RewardRulePolicy): void;
  remove(code: string): boolean;
  list(): RewardRulePolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRulePolicyStore implements RewardRulePolicyStore {
  items: Map<string, RewardRulePolicy>;
  order: string[];

  constructor(items: Map<string, RewardRulePolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRulePolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRulePolicy): void {
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

  list(): RewardRulePolicy[] {
    const out: RewardRulePolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRulePolicyStore(): RewardRulePolicyStore {
  return new MemoryRewardRulePolicyStore(new Map<string, RewardRulePolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRulePolicyStore implements RewardRulePolicyStore {
  inner: RewardRulePolicyStore;
  cache: cache.TtlCache<RewardRulePolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRulePolicyStore,
    cacheValue: cache.TtlCache<RewardRulePolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRulePolicy | undefined {
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

  save(item: RewardRulePolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRulePolicy[] {
    return this.inner.list();
  }
}

export function newCachedRewardRulePolicyStore(inner: RewardRulePolicyStore, ttl: number, clockValue: clock.Clock): RewardRulePolicyStore {
  return new CachedRewardRulePolicyStore(inner, cache.newTtlCache<RewardRulePolicy>(128, ttl, clockValue), 0, 0);
}

/** Selects reward rule policies. Empty fields match all. */
export class RewardRulePolicyQuery {
  label: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRulePolicy): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRulePolicy[]): RewardRulePolicy[] {
    const matched = collections.filter(items, (candidate: RewardRulePolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRulePolicies(store: RewardRulePolicyStore, query: RewardRulePolicyQuery): RewardRulePolicy[] {
  return query.apply(store.list());
}
