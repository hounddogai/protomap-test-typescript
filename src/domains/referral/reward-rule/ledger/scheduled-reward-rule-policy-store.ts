import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledRewardRulePolicy } from "./scheduled-reward-rule-policy.js";

/** Keeps scheduled reward rule policies by code. */
export interface ScheduledRewardRulePolicyStore {
  find(code: string): ScheduledRewardRulePolicy | undefined;
  save(item: ScheduledRewardRulePolicy): void;
  remove(code: string): boolean;
  list(): ScheduledRewardRulePolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledRewardRulePolicyStore implements ScheduledRewardRulePolicyStore {
  items: Map<string, ScheduledRewardRulePolicy>;
  order: string[];

  constructor(items: Map<string, ScheduledRewardRulePolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledRewardRulePolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledRewardRulePolicy): void {
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

  list(): ScheduledRewardRulePolicy[] {
    const out: ScheduledRewardRulePolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledRewardRulePolicyStore(): ScheduledRewardRulePolicyStore {
  return new MemoryScheduledRewardRulePolicyStore(new Map<string, ScheduledRewardRulePolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledRewardRulePolicyStore implements ScheduledRewardRulePolicyStore {
  inner: ScheduledRewardRulePolicyStore;
  cache: cache.TtlCache<ScheduledRewardRulePolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledRewardRulePolicyStore,
    cacheValue: cache.TtlCache<ScheduledRewardRulePolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledRewardRulePolicy | undefined {
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

  save(item: ScheduledRewardRulePolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledRewardRulePolicy[] {
    return this.inner.list();
  }
}

export function newCachedScheduledRewardRulePolicyStore(inner: ScheduledRewardRulePolicyStore, ttl: number, clockValue: clock.Clock): ScheduledRewardRulePolicyStore {
  return new CachedScheduledRewardRulePolicyStore(
    inner,
    cache.newTtlCache<ScheduledRewardRulePolicy>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled reward rule policies. Empty fields match all. */
export class ScheduledRewardRulePolicyQuery {
  locale: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAmount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledRewardRulePolicy): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledRewardRulePolicy[]): ScheduledRewardRulePolicy[] {
    const matched = collections.filter(items, (candidate: ScheduledRewardRulePolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledRewardRulePolicies(store: ScheduledRewardRulePolicyStore, query: ScheduledRewardRulePolicyQuery): ScheduledRewardRulePolicy[] {
  return query.apply(store.list());
}
