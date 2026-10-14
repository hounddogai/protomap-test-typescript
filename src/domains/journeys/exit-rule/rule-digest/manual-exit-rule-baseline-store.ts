import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualExitRuleBaseline } from "./manual-exit-rule-baseline.js";

/** Keeps manual exit rule baselines by code. */
export interface ManualExitRuleBaselineStore {
  find(code: string): ManualExitRuleBaseline | undefined;
  save(item: ManualExitRuleBaseline): void;
  remove(code: string): boolean;
  list(): ManualExitRuleBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualExitRuleBaselineStore implements ManualExitRuleBaselineStore {
  items: Map<string, ManualExitRuleBaseline>;
  order: string[];

  constructor(items: Map<string, ManualExitRuleBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualExitRuleBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualExitRuleBaseline): void {
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

  list(): ManualExitRuleBaseline[] {
    const out: ManualExitRuleBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualExitRuleBaselineStore(): ManualExitRuleBaselineStore {
  return new MemoryManualExitRuleBaselineStore(new Map<string, ManualExitRuleBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualExitRuleBaselineStore implements ManualExitRuleBaselineStore {
  inner: ManualExitRuleBaselineStore;
  cache: cache.TtlCache<ManualExitRuleBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualExitRuleBaselineStore,
    cacheValue: cache.TtlCache<ManualExitRuleBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualExitRuleBaseline | undefined {
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

  save(item: ManualExitRuleBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualExitRuleBaseline[] {
    return this.inner.list();
  }
}

export function newCachedManualExitRuleBaselineStore(inner: ManualExitRuleBaselineStore, ttl: number, clockValue: clock.Clock): ManualExitRuleBaselineStore {
  return new CachedManualExitRuleBaselineStore(
    inner,
    cache.newTtlCache<ManualExitRuleBaseline>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual exit rule baselines. Empty fields match all. */
export class ManualExitRuleBaselineQuery {
  locale: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBudget: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualExitRuleBaseline): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualExitRuleBaseline[]): ManualExitRuleBaseline[] {
    const matched = collections.filter(items, (candidate: ManualExitRuleBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualExitRuleBaselines(store: ManualExitRuleBaselineStore, query: ManualExitRuleBaselineQuery): ManualExitRuleBaseline[] {
  return query.apply(store.list());
}
