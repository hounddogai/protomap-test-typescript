import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditRule } from "./credit-rule.js";

/** Keeps credit rules by code. */
export interface CreditRuleStore {
  find(code: string): CreditRule | undefined;
  save(item: CreditRule): void;
  remove(code: string): boolean;
  list(): CreditRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditRuleStore implements CreditRuleStore {
  items: Map<string, CreditRule>;
  order: string[];

  constructor(items: Map<string, CreditRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditRule): void {
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

  list(): CreditRule[] {
    const out: CreditRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditRuleStore(): CreditRuleStore {
  return new MemoryCreditRuleStore(new Map<string, CreditRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditRuleStore implements CreditRuleStore {
  inner: CreditRuleStore;
  cache: cache.TtlCache<CreditRule>;
  hits: number;
  misses: number;

  constructor(inner: CreditRuleStore, cacheValue: cache.TtlCache<CreditRule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditRule | undefined {
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

  save(item: CreditRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditRule[] {
    return this.inner.list();
  }
}

export function newCachedCreditRuleStore(inner: CreditRuleStore, ttl: number, clockValue: clock.Clock): CreditRuleStore {
  return new CachedCreditRuleStore(inner, cache.newTtlCache<CreditRule>(256, ttl, clockValue), 0, 0);
}

/** Selects credit rules. Empty fields match all. */
export class CreditRuleQuery {
  label: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditRule): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditRule[]): CreditRule[] {
    const matched = collections.filter(items, (candidate: CreditRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditRules(store: CreditRuleStore, query: CreditRuleQuery): CreditRule[] {
  return query.apply(store.list());
}
