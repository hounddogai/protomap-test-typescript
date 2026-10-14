import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleEstimate } from "./exit-rule-estimate.js";

/** Keeps exit rule estimates by code. */
export interface ExitRuleEstimateStore {
  find(code: string): ExitRuleEstimate | undefined;
  save(item: ExitRuleEstimate): void;
  remove(code: string): boolean;
  list(): ExitRuleEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleEstimateStore implements ExitRuleEstimateStore {
  items: Map<string, ExitRuleEstimate>;
  order: string[];

  constructor(items: Map<string, ExitRuleEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleEstimate): void {
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

  list(): ExitRuleEstimate[] {
    const out: ExitRuleEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleEstimateStore(): ExitRuleEstimateStore {
  return new MemoryExitRuleEstimateStore(new Map<string, ExitRuleEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleEstimateStore implements ExitRuleEstimateStore {
  inner: ExitRuleEstimateStore;
  cache: cache.TtlCache<ExitRuleEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: ExitRuleEstimateStore,
    cacheValue: cache.TtlCache<ExitRuleEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleEstimate | undefined {
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

  save(item: ExitRuleEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleEstimate[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleEstimateStore(inner: ExitRuleEstimateStore, ttl: number, clockValue: clock.Clock): ExitRuleEstimateStore {
  return new CachedExitRuleEstimateStore(inner, cache.newTtlCache<ExitRuleEstimate>(64, ttl, clockValue), 0, 0);
}

/** Selects exit rule estimates. Empty fields match all. */
export class ExitRuleEstimateQuery {
  name: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleEstimate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleEstimate[]): ExitRuleEstimate[] {
    const matched = collections.filter(items, (candidate: ExitRuleEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleEstimates(store: ExitRuleEstimateStore, query: ExitRuleEstimateQuery): ExitRuleEstimate[] {
  return query.apply(store.list());
}
