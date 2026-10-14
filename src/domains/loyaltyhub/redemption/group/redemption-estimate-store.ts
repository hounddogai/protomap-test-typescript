import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionEstimate } from "./redemption-estimate.js";

/** Keeps redemption estimates by code. */
export interface RedemptionEstimateStore {
  find(code: string): RedemptionEstimate | undefined;
  save(item: RedemptionEstimate): void;
  remove(code: string): boolean;
  list(): RedemptionEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionEstimateStore implements RedemptionEstimateStore {
  items: Map<string, RedemptionEstimate>;
  order: string[];

  constructor(items: Map<string, RedemptionEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionEstimate): void {
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

  list(): RedemptionEstimate[] {
    const out: RedemptionEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionEstimateStore(): RedemptionEstimateStore {
  return new MemoryRedemptionEstimateStore(new Map<string, RedemptionEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionEstimateStore implements RedemptionEstimateStore {
  inner: RedemptionEstimateStore;
  cache: cache.TtlCache<RedemptionEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionEstimateStore,
    cacheValue: cache.TtlCache<RedemptionEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionEstimate | undefined {
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

  save(item: RedemptionEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionEstimate[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionEstimateStore(inner: RedemptionEstimateStore, ttl: number, clockValue: clock.Clock): RedemptionEstimateStore {
  return new CachedRedemptionEstimateStore(inner, cache.newTtlCache<RedemptionEstimate>(512, ttl, clockValue), 0, 0);
}

/** Selects redemption estimates. Empty fields match all. */
export class RedemptionEstimateQuery {
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

  matches(item: RedemptionEstimate): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionEstimate[]): RedemptionEstimate[] {
    const matched = collections.filter(items, (candidate: RedemptionEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionEstimates(store: RedemptionEstimateStore, query: RedemptionEstimateQuery): RedemptionEstimate[] {
  return query.apply(store.list());
}
