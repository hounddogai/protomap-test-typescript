import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacySubscriptionRule } from "./legacy-subscription-rule.js";

/** Keeps legacy subscription rules by code. */
export interface LegacySubscriptionRuleStore {
  find(code: string): LegacySubscriptionRule | undefined;
  save(item: LegacySubscriptionRule): void;
  remove(code: string): boolean;
  list(): LegacySubscriptionRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacySubscriptionRuleStore implements LegacySubscriptionRuleStore {
  items: Map<string, LegacySubscriptionRule>;
  order: string[];

  constructor(items: Map<string, LegacySubscriptionRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacySubscriptionRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacySubscriptionRule): void {
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

  list(): LegacySubscriptionRule[] {
    const out: LegacySubscriptionRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacySubscriptionRuleStore(): LegacySubscriptionRuleStore {
  return new MemoryLegacySubscriptionRuleStore(new Map<string, LegacySubscriptionRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacySubscriptionRuleStore implements LegacySubscriptionRuleStore {
  inner: LegacySubscriptionRuleStore;
  cache: cache.TtlCache<LegacySubscriptionRule>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacySubscriptionRuleStore,
    cacheValue: cache.TtlCache<LegacySubscriptionRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacySubscriptionRule | undefined {
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

  save(item: LegacySubscriptionRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacySubscriptionRule[] {
    return this.inner.list();
  }
}

export function newCachedLegacySubscriptionRuleStore(inner: LegacySubscriptionRuleStore, ttl: number, clockValue: clock.Clock): LegacySubscriptionRuleStore {
  return new CachedLegacySubscriptionRuleStore(
    inner,
    cache.newTtlCache<LegacySubscriptionRule>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy subscription rules. Empty fields match all. */
export class LegacySubscriptionRuleQuery {
  category: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minAmount: number, statuses: string[], limit: number) {
    this.category = category;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacySubscriptionRule): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacySubscriptionRule[]): LegacySubscriptionRule[] {
    const matched = collections.filter(items, (candidate: LegacySubscriptionRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacySubscriptionRules(store: LegacySubscriptionRuleStore, query: LegacySubscriptionRuleQuery): LegacySubscriptionRule[] {
  return query.apply(store.list());
}
