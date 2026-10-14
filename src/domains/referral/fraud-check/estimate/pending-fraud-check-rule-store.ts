import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingFraudCheckRule } from "./pending-fraud-check-rule.js";

/** Keeps pending fraud check rules by code. */
export interface PendingFraudCheckRuleStore {
  find(code: string): PendingFraudCheckRule | undefined;
  save(item: PendingFraudCheckRule): void;
  remove(code: string): boolean;
  list(): PendingFraudCheckRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingFraudCheckRuleStore implements PendingFraudCheckRuleStore {
  items: Map<string, PendingFraudCheckRule>;
  order: string[];

  constructor(items: Map<string, PendingFraudCheckRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingFraudCheckRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingFraudCheckRule): void {
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

  list(): PendingFraudCheckRule[] {
    const out: PendingFraudCheckRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingFraudCheckRuleStore(): PendingFraudCheckRuleStore {
  return new MemoryPendingFraudCheckRuleStore(new Map<string, PendingFraudCheckRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingFraudCheckRuleStore implements PendingFraudCheckRuleStore {
  inner: PendingFraudCheckRuleStore;
  cache: cache.TtlCache<PendingFraudCheckRule>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingFraudCheckRuleStore,
    cacheValue: cache.TtlCache<PendingFraudCheckRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingFraudCheckRule | undefined {
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

  save(item: PendingFraudCheckRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingFraudCheckRule[] {
    return this.inner.list();
  }
}

export function newCachedPendingFraudCheckRuleStore(inner: PendingFraudCheckRuleStore, ttl: number, clockValue: clock.Clock): PendingFraudCheckRuleStore {
  return new CachedPendingFraudCheckRuleStore(
    inner,
    cache.newTtlCache<PendingFraudCheckRule>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending fraud check rules. Empty fields match all. */
export class PendingFraudCheckRuleQuery {
  unit: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minThreshold: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingFraudCheckRule): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingFraudCheckRule[]): PendingFraudCheckRule[] {
    const matched = collections.filter(items, (candidate: PendingFraudCheckRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingFraudCheckRules(store: PendingFraudCheckRuleStore, query: PendingFraudCheckRuleQuery): PendingFraudCheckRule[] {
  return query.apply(store.list());
}
