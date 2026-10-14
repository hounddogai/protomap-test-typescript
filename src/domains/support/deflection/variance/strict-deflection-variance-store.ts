import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictDeflectionVariance } from "./strict-deflection-variance.js";

/** Keeps strict deflection variances by code. */
export interface StrictDeflectionVarianceStore {
  find(code: string): StrictDeflectionVariance | undefined;
  save(item: StrictDeflectionVariance): void;
  remove(code: string): boolean;
  list(): StrictDeflectionVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictDeflectionVarianceStore implements StrictDeflectionVarianceStore {
  items: Map<string, StrictDeflectionVariance>;
  order: string[];

  constructor(items: Map<string, StrictDeflectionVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictDeflectionVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictDeflectionVariance): void {
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

  list(): StrictDeflectionVariance[] {
    const out: StrictDeflectionVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictDeflectionVarianceStore(): StrictDeflectionVarianceStore {
  return new MemoryStrictDeflectionVarianceStore(new Map<string, StrictDeflectionVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictDeflectionVarianceStore implements StrictDeflectionVarianceStore {
  inner: StrictDeflectionVarianceStore;
  cache: cache.TtlCache<StrictDeflectionVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictDeflectionVarianceStore,
    cacheValue: cache.TtlCache<StrictDeflectionVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictDeflectionVariance | undefined {
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

  save(item: StrictDeflectionVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictDeflectionVariance[] {
    return this.inner.list();
  }
}

export function newCachedStrictDeflectionVarianceStore(inner: StrictDeflectionVarianceStore, ttl: number, clockValue: clock.Clock): StrictDeflectionVarianceStore {
  return new CachedStrictDeflectionVarianceStore(
    inner,
    cache.newTtlCache<StrictDeflectionVariance>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict deflection variances. Empty fields match all. */
export class StrictDeflectionVarianceQuery {
  category: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minConversionRate: number, statuses: string[], limit: number) {
    this.category = category;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictDeflectionVariance): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictDeflectionVariance[]): StrictDeflectionVariance[] {
    const matched = collections.filter(items, (candidate: StrictDeflectionVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictDeflectionVariances(store: StrictDeflectionVarianceStore, query: StrictDeflectionVarianceQuery): StrictDeflectionVariance[] {
  return query.apply(store.list());
}
