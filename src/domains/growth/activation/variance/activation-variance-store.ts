import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationVariance } from "./activation-variance.js";

/** Keeps activation variances by code. */
export interface ActivationVarianceStore {
  find(code: string): ActivationVariance | undefined;
  save(item: ActivationVariance): void;
  remove(code: string): boolean;
  list(): ActivationVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationVarianceStore implements ActivationVarianceStore {
  items: Map<string, ActivationVariance>;
  order: string[];

  constructor(items: Map<string, ActivationVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationVariance): void {
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

  list(): ActivationVariance[] {
    const out: ActivationVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationVarianceStore(): ActivationVarianceStore {
  return new MemoryActivationVarianceStore(new Map<string, ActivationVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationVarianceStore implements ActivationVarianceStore {
  inner: ActivationVarianceStore;
  cache: cache.TtlCache<ActivationVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationVarianceStore,
    cacheValue: cache.TtlCache<ActivationVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationVariance | undefined {
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

  save(item: ActivationVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationVariance[] {
    return this.inner.list();
  }
}

export function newCachedActivationVarianceStore(inner: ActivationVarianceStore, ttl: number, clockValue: clock.Clock): ActivationVarianceStore {
  return new CachedActivationVarianceStore(inner, cache.newTtlCache<ActivationVariance>(128, ttl, clockValue), 0, 0);
}

/** Selects activation variances. Empty fields match all. */
export class ActivationVarianceQuery {
  name: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minConversionRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ActivationVariance): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationVariance[]): ActivationVariance[] {
    const matched = collections.filter(items, (candidate: ActivationVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationVariances(store: ActivationVarianceStore, query: ActivationVarianceQuery): ActivationVariance[] {
  return query.apply(store.list());
}
