import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditEstimate } from "./credit-estimate.js";

/** Keeps credit estimates by code. */
export interface CreditEstimateStore {
  find(code: string): CreditEstimate | undefined;
  save(item: CreditEstimate): void;
  remove(code: string): boolean;
  list(): CreditEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditEstimateStore implements CreditEstimateStore {
  items: Map<string, CreditEstimate>;
  order: string[];

  constructor(items: Map<string, CreditEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditEstimate): void {
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

  list(): CreditEstimate[] {
    const out: CreditEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditEstimateStore(): CreditEstimateStore {
  return new MemoryCreditEstimateStore(new Map<string, CreditEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditEstimateStore implements CreditEstimateStore {
  inner: CreditEstimateStore;
  cache: cache.TtlCache<CreditEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: CreditEstimateStore,
    cacheValue: cache.TtlCache<CreditEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditEstimate | undefined {
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

  save(item: CreditEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditEstimate[] {
    return this.inner.list();
  }
}

export function newCachedCreditEstimateStore(inner: CreditEstimateStore, ttl: number, clockValue: clock.Clock): CreditEstimateStore {
  return new CachedCreditEstimateStore(inner, cache.newTtlCache<CreditEstimate>(1024, ttl, clockValue), 0, 0);
}

/** Selects credit estimates. Empty fields match all. */
export class CreditEstimateQuery {
  channel: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRatio: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditEstimate): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditEstimate[]): CreditEstimate[] {
    const matched = collections.filter(items, (candidate: CreditEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditEstimates(store: CreditEstimateStore, query: CreditEstimateQuery): CreditEstimate[] {
  return query.apply(store.list());
}
