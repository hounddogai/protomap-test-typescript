import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditThreshold } from "./credit-threshold.js";

/** Keeps credit thresholds by code. */
export interface CreditThresholdStore {
  find(code: string): CreditThreshold | undefined;
  save(item: CreditThreshold): void;
  remove(code: string): boolean;
  list(): CreditThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditThresholdStore implements CreditThresholdStore {
  items: Map<string, CreditThreshold>;
  order: string[];

  constructor(items: Map<string, CreditThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditThreshold): void {
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

  list(): CreditThreshold[] {
    const out: CreditThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditThresholdStore(): CreditThresholdStore {
  return new MemoryCreditThresholdStore(new Map<string, CreditThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditThresholdStore implements CreditThresholdStore {
  inner: CreditThresholdStore;
  cache: cache.TtlCache<CreditThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: CreditThresholdStore,
    cacheValue: cache.TtlCache<CreditThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditThreshold | undefined {
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

  save(item: CreditThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditThreshold[] {
    return this.inner.list();
  }
}

export function newCachedCreditThresholdStore(inner: CreditThresholdStore, ttl: number, clockValue: clock.Clock): CreditThresholdStore {
  return new CachedCreditThresholdStore(inner, cache.newTtlCache<CreditThreshold>(1024, ttl, clockValue), 0, 0);
}

/** Selects credit thresholds. Empty fields match all. */
export class CreditThresholdQuery {
  region: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minConversionRate: number, statuses: string[], limit: number) {
    this.region = region;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditThreshold): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditThreshold[]): CreditThreshold[] {
    const matched = collections.filter(items, (candidate: CreditThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditThresholds(store: CreditThresholdStore, query: CreditThresholdQuery): CreditThreshold[] {
  return query.apply(store.list());
}
