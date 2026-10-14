import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionVariance } from "./deflection-variance.js";

/** Keeps deflection variances by code. */
export interface DeflectionVarianceStore {
  find(code: string): DeflectionVariance | undefined;
  save(item: DeflectionVariance): void;
  remove(code: string): boolean;
  list(): DeflectionVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionVarianceStore implements DeflectionVarianceStore {
  items: Map<string, DeflectionVariance>;
  order: string[];

  constructor(items: Map<string, DeflectionVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionVariance): void {
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

  list(): DeflectionVariance[] {
    const out: DeflectionVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionVarianceStore(): DeflectionVarianceStore {
  return new MemoryDeflectionVarianceStore(new Map<string, DeflectionVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionVarianceStore implements DeflectionVarianceStore {
  inner: DeflectionVarianceStore;
  cache: cache.TtlCache<DeflectionVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionVarianceStore,
    cacheValue: cache.TtlCache<DeflectionVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionVariance | undefined {
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

  save(item: DeflectionVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionVariance[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionVarianceStore(inner: DeflectionVarianceStore, ttl: number, clockValue: clock.Clock): DeflectionVarianceStore {
  return new CachedDeflectionVarianceStore(inner, cache.newTtlCache<DeflectionVariance>(1024, ttl, clockValue), 0, 0);
}

/** Selects deflection variances. Empty fields match all. */
export class DeflectionVarianceQuery {
  locale: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minStartsAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionVariance): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionVariance[]): DeflectionVariance[] {
    const matched = collections.filter(items, (candidate: DeflectionVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionVariances(store: DeflectionVarianceStore, query: DeflectionVarianceQuery): DeflectionVariance[] {
  return query.apply(store.list());
}
