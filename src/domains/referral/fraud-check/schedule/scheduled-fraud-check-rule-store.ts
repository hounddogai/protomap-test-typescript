import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledFraudCheckRule } from "./scheduled-fraud-check-rule.js";

/** Keeps scheduled fraud check rules by code. */
export interface ScheduledFraudCheckRuleStore {
  find(code: string): ScheduledFraudCheckRule | undefined;
  save(item: ScheduledFraudCheckRule): void;
  remove(code: string): boolean;
  list(): ScheduledFraudCheckRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledFraudCheckRuleStore implements ScheduledFraudCheckRuleStore {
  items: Map<string, ScheduledFraudCheckRule>;
  order: string[];

  constructor(items: Map<string, ScheduledFraudCheckRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledFraudCheckRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledFraudCheckRule): void {
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

  list(): ScheduledFraudCheckRule[] {
    const out: ScheduledFraudCheckRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledFraudCheckRuleStore(): ScheduledFraudCheckRuleStore {
  return new MemoryScheduledFraudCheckRuleStore(new Map<string, ScheduledFraudCheckRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledFraudCheckRuleStore implements ScheduledFraudCheckRuleStore {
  inner: ScheduledFraudCheckRuleStore;
  cache: cache.TtlCache<ScheduledFraudCheckRule>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledFraudCheckRuleStore,
    cacheValue: cache.TtlCache<ScheduledFraudCheckRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledFraudCheckRule | undefined {
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

  save(item: ScheduledFraudCheckRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledFraudCheckRule[] {
    return this.inner.list();
  }
}

export function newCachedScheduledFraudCheckRuleStore(inner: ScheduledFraudCheckRuleStore, ttl: number, clockValue: clock.Clock): ScheduledFraudCheckRuleStore {
  return new CachedScheduledFraudCheckRuleStore(
    inner,
    cache.newTtlCache<ScheduledFraudCheckRule>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled fraud check rules. Empty fields match all. */
export class ScheduledFraudCheckRuleQuery {
  name: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minImpressions: number, statuses: string[], limit: number) {
    this.name = name;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledFraudCheckRule): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledFraudCheckRule[]): ScheduledFraudCheckRule[] {
    const matched = collections.filter(items, (candidate: ScheduledFraudCheckRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledFraudCheckRules(store: ScheduledFraudCheckRuleStore, query: ScheduledFraudCheckRuleQuery): ScheduledFraudCheckRule[] {
  return query.apply(store.list());
}
