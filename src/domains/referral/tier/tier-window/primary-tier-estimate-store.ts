import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryTierEstimate } from "./primary-tier-estimate.js";

/** Keeps primary tier estimates by code. */
export interface PrimaryTierEstimateStore {
  find(code: string): PrimaryTierEstimate | undefined;
  save(item: PrimaryTierEstimate): void;
  remove(code: string): boolean;
  list(): PrimaryTierEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryTierEstimateStore implements PrimaryTierEstimateStore {
  items: Map<string, PrimaryTierEstimate>;
  order: string[];

  constructor(items: Map<string, PrimaryTierEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryTierEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryTierEstimate): void {
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

  list(): PrimaryTierEstimate[] {
    const out: PrimaryTierEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryTierEstimateStore(): PrimaryTierEstimateStore {
  return new MemoryPrimaryTierEstimateStore(new Map<string, PrimaryTierEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryTierEstimateStore implements PrimaryTierEstimateStore {
  inner: PrimaryTierEstimateStore;
  cache: cache.TtlCache<PrimaryTierEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryTierEstimateStore,
    cacheValue: cache.TtlCache<PrimaryTierEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryTierEstimate | undefined {
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

  save(item: PrimaryTierEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryTierEstimate[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryTierEstimateStore(inner: PrimaryTierEstimateStore, ttl: number, clockValue: clock.Clock): PrimaryTierEstimateStore {
  return new CachedPrimaryTierEstimateStore(inner, cache.newTtlCache<PrimaryTierEstimate>(1024, ttl, clockValue), 0, 0);
}

/** Selects primary tier estimates. Empty fields match all. */
export class PrimaryTierEstimateQuery {
  channel: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minLimit: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryTierEstimate): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryTierEstimate[]): PrimaryTierEstimate[] {
    const matched = collections.filter(items, (candidate: PrimaryTierEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryTierEstimates(store: PrimaryTierEstimateStore, query: PrimaryTierEstimateQuery): PrimaryTierEstimate[] {
  return query.apply(store.list());
}
