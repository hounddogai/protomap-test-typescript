import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultRedemptionEstimate } from "./default-redemption-estimate.js";

/** Keeps default redemption estimates by code. */
export interface DefaultRedemptionEstimateStore {
  find(code: string): DefaultRedemptionEstimate | undefined;
  save(item: DefaultRedemptionEstimate): void;
  remove(code: string): boolean;
  list(): DefaultRedemptionEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultRedemptionEstimateStore implements DefaultRedemptionEstimateStore {
  items: Map<string, DefaultRedemptionEstimate>;
  order: string[];

  constructor(items: Map<string, DefaultRedemptionEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultRedemptionEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultRedemptionEstimate): void {
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

  list(): DefaultRedemptionEstimate[] {
    const out: DefaultRedemptionEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultRedemptionEstimateStore(): DefaultRedemptionEstimateStore {
  return new MemoryDefaultRedemptionEstimateStore(new Map<string, DefaultRedemptionEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultRedemptionEstimateStore implements DefaultRedemptionEstimateStore {
  inner: DefaultRedemptionEstimateStore;
  cache: cache.TtlCache<DefaultRedemptionEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultRedemptionEstimateStore,
    cacheValue: cache.TtlCache<DefaultRedemptionEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultRedemptionEstimate | undefined {
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

  save(item: DefaultRedemptionEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultRedemptionEstimate[] {
    return this.inner.list();
  }
}

export function newCachedDefaultRedemptionEstimateStore(inner: DefaultRedemptionEstimateStore, ttl: number, clockValue: clock.Clock): DefaultRedemptionEstimateStore {
  return new CachedDefaultRedemptionEstimateStore(
    inner,
    cache.newTtlCache<DefaultRedemptionEstimate>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default redemption estimates. Empty fields match all. */
export class DefaultRedemptionEstimateQuery {
  unit: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minAmount: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultRedemptionEstimate): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultRedemptionEstimate[]): DefaultRedemptionEstimate[] {
    const matched = collections.filter(items, (candidate: DefaultRedemptionEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultRedemptionEstimates(store: DefaultRedemptionEstimateStore, query: DefaultRedemptionEstimateQuery): DefaultRedemptionEstimate[] {
  return query.apply(store.list());
}
