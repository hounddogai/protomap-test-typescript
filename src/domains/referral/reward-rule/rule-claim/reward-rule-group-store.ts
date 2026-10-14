import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleGroup } from "./reward-rule-group.js";

/** Keeps reward rule groups by code. */
export interface RewardRuleGroupStore {
  find(code: string): RewardRuleGroup | undefined;
  save(item: RewardRuleGroup): void;
  remove(code: string): boolean;
  list(): RewardRuleGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleGroupStore implements RewardRuleGroupStore {
  items: Map<string, RewardRuleGroup>;
  order: string[];

  constructor(items: Map<string, RewardRuleGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleGroup): void {
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

  list(): RewardRuleGroup[] {
    const out: RewardRuleGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleGroupStore(): RewardRuleGroupStore {
  return new MemoryRewardRuleGroupStore(new Map<string, RewardRuleGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleGroupStore implements RewardRuleGroupStore {
  inner: RewardRuleGroupStore;
  cache: cache.TtlCache<RewardRuleGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleGroupStore,
    cacheValue: cache.TtlCache<RewardRuleGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleGroup | undefined {
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

  save(item: RewardRuleGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleGroup[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleGroupStore(inner: RewardRuleGroupStore, ttl: number, clockValue: clock.Clock): RewardRuleGroupStore {
  return new CachedRewardRuleGroupStore(inner, cache.newTtlCache<RewardRuleGroup>(1024, ttl, clockValue), 0, 0);
}

/** Selects reward rule groups. Empty fields match all. */
export class RewardRuleGroupQuery {
  locale: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minDiscount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleGroup): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleGroup[]): RewardRuleGroup[] {
    const matched = collections.filter(items, (candidate: RewardRuleGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleGroups(store: RewardRuleGroupStore, query: RewardRuleGroupQuery): RewardRuleGroup[] {
  return query.apply(store.list());
}
