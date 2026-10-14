import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedOptOutRule } from "./weighted-opt-out-rule.js";

/** Keeps weighted opt out rules by code. */
export interface WeightedOptOutRuleStore {
  find(code: string): WeightedOptOutRule | undefined;
  save(item: WeightedOptOutRule): void;
  remove(code: string): boolean;
  list(): WeightedOptOutRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedOptOutRuleStore implements WeightedOptOutRuleStore {
  items: Map<string, WeightedOptOutRule>;
  order: string[];

  constructor(items: Map<string, WeightedOptOutRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedOptOutRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedOptOutRule): void {
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

  list(): WeightedOptOutRule[] {
    const out: WeightedOptOutRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedOptOutRuleStore(): WeightedOptOutRuleStore {
  return new MemoryWeightedOptOutRuleStore(new Map<string, WeightedOptOutRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedOptOutRuleStore implements WeightedOptOutRuleStore {
  inner: WeightedOptOutRuleStore;
  cache: cache.TtlCache<WeightedOptOutRule>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedOptOutRuleStore,
    cacheValue: cache.TtlCache<WeightedOptOutRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedOptOutRule | undefined {
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

  save(item: WeightedOptOutRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedOptOutRule[] {
    return this.inner.list();
  }
}

export function newCachedWeightedOptOutRuleStore(inner: WeightedOptOutRuleStore, ttl: number, clockValue: clock.Clock): WeightedOptOutRuleStore {
  return new CachedWeightedOptOutRuleStore(inner, cache.newTtlCache<WeightedOptOutRule>(64, ttl, clockValue), 0, 0);
}

/** Selects weighted opt out rules. Empty fields match all. */
export class WeightedOptOutRuleQuery {
  source: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minSequence: number, statuses: string[], limit: number) {
    this.source = source;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedOptOutRule): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedOptOutRule[]): WeightedOptOutRule[] {
    const matched = collections.filter(items, (candidate: WeightedOptOutRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedOptOutRules(store: WeightedOptOutRuleStore, query: WeightedOptOutRuleQuery): WeightedOptOutRule[] {
  return query.apply(store.list());
}
