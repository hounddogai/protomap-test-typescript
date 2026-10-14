import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleBundle } from "./reward-rule-bundle.js";

/** Keeps reward rule bundles by code. */
export interface RewardRuleBundleStore {
  find(code: string): RewardRuleBundle | undefined;
  save(item: RewardRuleBundle): void;
  remove(code: string): boolean;
  list(): RewardRuleBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleBundleStore implements RewardRuleBundleStore {
  items: Map<string, RewardRuleBundle>;
  order: string[];

  constructor(items: Map<string, RewardRuleBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleBundle): void {
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

  list(): RewardRuleBundle[] {
    const out: RewardRuleBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleBundleStore(): RewardRuleBundleStore {
  return new MemoryRewardRuleBundleStore(new Map<string, RewardRuleBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleBundleStore implements RewardRuleBundleStore {
  inner: RewardRuleBundleStore;
  cache: cache.TtlCache<RewardRuleBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleBundleStore,
    cacheValue: cache.TtlCache<RewardRuleBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleBundle | undefined {
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

  save(item: RewardRuleBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleBundle[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleBundleStore(inner: RewardRuleBundleStore, ttl: number, clockValue: clock.Clock): RewardRuleBundleStore {
  return new CachedRewardRuleBundleStore(inner, cache.newTtlCache<RewardRuleBundle>(1024, ttl, clockValue), 0, 0);
}

/** Selects reward rule bundles. Empty fields match all. */
export class RewardRuleBundleQuery {
  locale: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minWindowDays: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleBundle): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleBundle[]): RewardRuleBundle[] {
    const matched = collections.filter(items, (candidate: RewardRuleBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleBundles(store: RewardRuleBundleStore, query: RewardRuleBundleQuery): RewardRuleBundle[] {
  return query.apply(store.list());
}
