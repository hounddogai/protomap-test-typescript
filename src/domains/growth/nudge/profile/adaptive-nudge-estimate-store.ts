import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveNudgeEstimate } from "./adaptive-nudge-estimate.js";

/** Keeps adaptive nudge estimates by code. */
export interface AdaptiveNudgeEstimateStore {
  find(code: string): AdaptiveNudgeEstimate | undefined;
  save(item: AdaptiveNudgeEstimate): void;
  remove(code: string): boolean;
  list(): AdaptiveNudgeEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveNudgeEstimateStore implements AdaptiveNudgeEstimateStore {
  items: Map<string, AdaptiveNudgeEstimate>;
  order: string[];

  constructor(items: Map<string, AdaptiveNudgeEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveNudgeEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveNudgeEstimate): void {
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

  list(): AdaptiveNudgeEstimate[] {
    const out: AdaptiveNudgeEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveNudgeEstimateStore(): AdaptiveNudgeEstimateStore {
  return new MemoryAdaptiveNudgeEstimateStore(new Map<string, AdaptiveNudgeEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveNudgeEstimateStore implements AdaptiveNudgeEstimateStore {
  inner: AdaptiveNudgeEstimateStore;
  cache: cache.TtlCache<AdaptiveNudgeEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveNudgeEstimateStore,
    cacheValue: cache.TtlCache<AdaptiveNudgeEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveNudgeEstimate | undefined {
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

  save(item: AdaptiveNudgeEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveNudgeEstimate[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveNudgeEstimateStore(inner: AdaptiveNudgeEstimateStore, ttl: number, clockValue: clock.Clock): AdaptiveNudgeEstimateStore {
  return new CachedAdaptiveNudgeEstimateStore(
    inner,
    cache.newTtlCache<AdaptiveNudgeEstimate>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive nudge estimates. Empty fields match all. */
export class AdaptiveNudgeEstimateQuery {
  region: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minAmount: number, statuses: string[], limit: number) {
    this.region = region;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveNudgeEstimate): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveNudgeEstimate[]): AdaptiveNudgeEstimate[] {
    const matched = collections.filter(items, (candidate: AdaptiveNudgeEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveNudgeEstimates(store: AdaptiveNudgeEstimateStore, query: AdaptiveNudgeEstimateQuery): AdaptiveNudgeEstimate[] {
  return query.apply(store.list());
}
