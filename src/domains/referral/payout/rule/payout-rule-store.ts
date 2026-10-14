import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PayoutRule } from "./payout-rule.js";

/** Keeps payout rules by code. */
export interface PayoutRuleStore {
  find(code: string): PayoutRule | undefined;
  save(item: PayoutRule): void;
  remove(code: string): boolean;
  list(): PayoutRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPayoutRuleStore implements PayoutRuleStore {
  items: Map<string, PayoutRule>;
  order: string[];

  constructor(items: Map<string, PayoutRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PayoutRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PayoutRule): void {
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

  list(): PayoutRule[] {
    const out: PayoutRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPayoutRuleStore(): PayoutRuleStore {
  return new MemoryPayoutRuleStore(new Map<string, PayoutRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPayoutRuleStore implements PayoutRuleStore {
  inner: PayoutRuleStore;
  cache: cache.TtlCache<PayoutRule>;
  hits: number;
  misses: number;

  constructor(inner: PayoutRuleStore, cacheValue: cache.TtlCache<PayoutRule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PayoutRule | undefined {
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

  save(item: PayoutRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PayoutRule[] {
    return this.inner.list();
  }
}

export function newCachedPayoutRuleStore(inner: PayoutRuleStore, ttl: number, clockValue: clock.Clock): PayoutRuleStore {
  return new CachedPayoutRuleStore(inner, cache.newTtlCache<PayoutRule>(128, ttl, clockValue), 0, 0);
}

/** Selects payout rules. Empty fields match all. */
export class PayoutRuleQuery {
  locale: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minSequence: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PayoutRule): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PayoutRule[]): PayoutRule[] {
    const matched = collections.filter(items, (candidate: PayoutRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPayoutRules(store: PayoutRuleStore, query: PayoutRuleQuery): PayoutRule[] {
  return query.apply(store.list());
}
