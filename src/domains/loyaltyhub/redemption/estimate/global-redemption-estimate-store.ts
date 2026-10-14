import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalRedemptionEstimate } from "./global-redemption-estimate.js";

/** Keeps global redemption estimates by code. */
export interface GlobalRedemptionEstimateStore {
  find(code: string): GlobalRedemptionEstimate | undefined;
  save(item: GlobalRedemptionEstimate): void;
  remove(code: string): boolean;
  list(): GlobalRedemptionEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalRedemptionEstimateStore implements GlobalRedemptionEstimateStore {
  items: Map<string, GlobalRedemptionEstimate>;
  order: string[];

  constructor(items: Map<string, GlobalRedemptionEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalRedemptionEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalRedemptionEstimate): void {
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

  list(): GlobalRedemptionEstimate[] {
    const out: GlobalRedemptionEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalRedemptionEstimateStore(): GlobalRedemptionEstimateStore {
  return new MemoryGlobalRedemptionEstimateStore(new Map<string, GlobalRedemptionEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalRedemptionEstimateStore implements GlobalRedemptionEstimateStore {
  inner: GlobalRedemptionEstimateStore;
  cache: cache.TtlCache<GlobalRedemptionEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalRedemptionEstimateStore,
    cacheValue: cache.TtlCache<GlobalRedemptionEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalRedemptionEstimate | undefined {
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

  save(item: GlobalRedemptionEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalRedemptionEstimate[] {
    return this.inner.list();
  }
}

export function newCachedGlobalRedemptionEstimateStore(inner: GlobalRedemptionEstimateStore, ttl: number, clockValue: clock.Clock): GlobalRedemptionEstimateStore {
  return new CachedGlobalRedemptionEstimateStore(
    inner,
    cache.newTtlCache<GlobalRedemptionEstimate>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global redemption estimates. Empty fields match all. */
export class GlobalRedemptionEstimateQuery {
  channel: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minConversionRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalRedemptionEstimate): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalRedemptionEstimate[]): GlobalRedemptionEstimate[] {
    const matched = collections.filter(items, (candidate: GlobalRedemptionEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalRedemptionEstimates(store: GlobalRedemptionEstimateStore, query: GlobalRedemptionEstimateQuery): GlobalRedemptionEstimate[] {
  return query.apply(store.list());
}
