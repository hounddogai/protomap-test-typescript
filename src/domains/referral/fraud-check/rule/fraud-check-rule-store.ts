import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckRule } from "./fraud-check-rule.js";

/** Keeps fraud check rules by code. */
export interface FraudCheckRuleStore {
  find(code: string): FraudCheckRule | undefined;
  save(item: FraudCheckRule): void;
  remove(code: string): boolean;
  list(): FraudCheckRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckRuleStore implements FraudCheckRuleStore {
  items: Map<string, FraudCheckRule>;
  order: string[];

  constructor(items: Map<string, FraudCheckRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckRule): void {
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

  list(): FraudCheckRule[] {
    const out: FraudCheckRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckRuleStore(): FraudCheckRuleStore {
  return new MemoryFraudCheckRuleStore(new Map<string, FraudCheckRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckRuleStore implements FraudCheckRuleStore {
  inner: FraudCheckRuleStore;
  cache: cache.TtlCache<FraudCheckRule>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckRuleStore,
    cacheValue: cache.TtlCache<FraudCheckRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckRule | undefined {
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

  save(item: FraudCheckRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckRule[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckRuleStore(inner: FraudCheckRuleStore, ttl: number, clockValue: clock.Clock): FraudCheckRuleStore {
  return new CachedFraudCheckRuleStore(inner, cache.newTtlCache<FraudCheckRule>(1024, ttl, clockValue), 0, 0);
}

/** Selects fraud check rules. Empty fields match all. */
export class FraudCheckRuleQuery {
  segment: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minBudget: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckRule): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckRule[]): FraudCheckRule[] {
    const matched = collections.filter(items, (candidate: FraudCheckRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckRules(store: FraudCheckRuleStore, query: FraudCheckRuleQuery): FraudCheckRule[] {
  return query.apply(store.list());
}
