import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckBaseline } from "./fraud-check-baseline.js";

/** Keeps fraud check baselines by code. */
export interface FraudCheckBaselineStore {
  find(code: string): FraudCheckBaseline | undefined;
  save(item: FraudCheckBaseline): void;
  remove(code: string): boolean;
  list(): FraudCheckBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckBaselineStore implements FraudCheckBaselineStore {
  items: Map<string, FraudCheckBaseline>;
  order: string[];

  constructor(items: Map<string, FraudCheckBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckBaseline): void {
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

  list(): FraudCheckBaseline[] {
    const out: FraudCheckBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckBaselineStore(): FraudCheckBaselineStore {
  return new MemoryFraudCheckBaselineStore(new Map<string, FraudCheckBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckBaselineStore implements FraudCheckBaselineStore {
  inner: FraudCheckBaselineStore;
  cache: cache.TtlCache<FraudCheckBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckBaselineStore,
    cacheValue: cache.TtlCache<FraudCheckBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckBaseline | undefined {
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

  save(item: FraudCheckBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckBaseline[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckBaselineStore(inner: FraudCheckBaselineStore, ttl: number, clockValue: clock.Clock): FraudCheckBaselineStore {
  return new CachedFraudCheckBaselineStore(inner, cache.newTtlCache<FraudCheckBaseline>(256, ttl, clockValue), 0, 0);
}

/** Selects fraud check baselines. Empty fields match all. */
export class FraudCheckBaselineQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckBaseline): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckBaseline[]): FraudCheckBaseline[] {
    const matched = collections.filter(items, (candidate: FraudCheckBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckBaselines(store: FraudCheckBaselineStore, query: FraudCheckBaselineQuery): FraudCheckBaseline[] {
  return query.apply(store.list());
}
