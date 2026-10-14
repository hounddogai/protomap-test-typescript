import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictReputationRule } from "./strict-reputation-rule.js";

/** Keeps strict reputation rules by code. */
export interface StrictReputationRuleStore {
  find(code: string): StrictReputationRule | undefined;
  save(item: StrictReputationRule): void;
  remove(code: string): boolean;
  list(): StrictReputationRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictReputationRuleStore implements StrictReputationRuleStore {
  items: Map<string, StrictReputationRule>;
  order: string[];

  constructor(items: Map<string, StrictReputationRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictReputationRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictReputationRule): void {
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

  list(): StrictReputationRule[] {
    const out: StrictReputationRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictReputationRuleStore(): StrictReputationRuleStore {
  return new MemoryStrictReputationRuleStore(new Map<string, StrictReputationRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictReputationRuleStore implements StrictReputationRuleStore {
  inner: StrictReputationRuleStore;
  cache: cache.TtlCache<StrictReputationRule>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictReputationRuleStore,
    cacheValue: cache.TtlCache<StrictReputationRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictReputationRule | undefined {
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

  save(item: StrictReputationRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictReputationRule[] {
    return this.inner.list();
  }
}

export function newCachedStrictReputationRuleStore(inner: StrictReputationRuleStore, ttl: number, clockValue: clock.Clock): StrictReputationRuleStore {
  return new CachedStrictReputationRuleStore(
    inner,
    cache.newTtlCache<StrictReputationRule>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict reputation rules. Empty fields match all. */
export class StrictReputationRuleQuery {
  locale: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictReputationRule): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictReputationRule[]): StrictReputationRule[] {
    const matched = collections.filter(items, (candidate: StrictReputationRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictReputationRules(store: StrictReputationRuleStore, query: StrictReputationRuleQuery): StrictReputationRule[] {
  return query.apply(store.list());
}
