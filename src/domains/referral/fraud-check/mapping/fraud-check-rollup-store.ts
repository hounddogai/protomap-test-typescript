import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckRollup } from "./fraud-check-rollup.js";

/** Keeps fraud check rollups by code. */
export interface FraudCheckRollupStore {
  find(code: string): FraudCheckRollup | undefined;
  save(item: FraudCheckRollup): void;
  remove(code: string): boolean;
  list(): FraudCheckRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckRollupStore implements FraudCheckRollupStore {
  items: Map<string, FraudCheckRollup>;
  order: string[];

  constructor(items: Map<string, FraudCheckRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckRollup): void {
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

  list(): FraudCheckRollup[] {
    const out: FraudCheckRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckRollupStore(): FraudCheckRollupStore {
  return new MemoryFraudCheckRollupStore(new Map<string, FraudCheckRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckRollupStore implements FraudCheckRollupStore {
  inner: FraudCheckRollupStore;
  cache: cache.TtlCache<FraudCheckRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckRollupStore,
    cacheValue: cache.TtlCache<FraudCheckRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckRollup | undefined {
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

  save(item: FraudCheckRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckRollup[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckRollupStore(inner: FraudCheckRollupStore, ttl: number, clockValue: clock.Clock): FraudCheckRollupStore {
  return new CachedFraudCheckRollupStore(inner, cache.newTtlCache<FraudCheckRollup>(128, ttl, clockValue), 0, 0);
}

/** Selects fraud check rollups. Empty fields match all. */
export class FraudCheckRollupQuery {
  utmSource: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minConversionRate: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckRollup): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckRollup[]): FraudCheckRollup[] {
    const matched = collections.filter(items, (candidate: FraudCheckRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckRollups(store: FraudCheckRollupStore, query: FraudCheckRollupQuery): FraudCheckRollup[] {
  return query.apply(store.list());
}
