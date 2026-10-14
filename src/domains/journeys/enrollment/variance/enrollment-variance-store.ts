import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentVariance } from "./enrollment-variance.js";

/** Keeps enrollment variances by code. */
export interface EnrollmentVarianceStore {
  find(code: string): EnrollmentVariance | undefined;
  save(item: EnrollmentVariance): void;
  remove(code: string): boolean;
  list(): EnrollmentVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentVarianceStore implements EnrollmentVarianceStore {
  items: Map<string, EnrollmentVariance>;
  order: string[];

  constructor(items: Map<string, EnrollmentVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentVariance): void {
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

  list(): EnrollmentVariance[] {
    const out: EnrollmentVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentVarianceStore(): EnrollmentVarianceStore {
  return new MemoryEnrollmentVarianceStore(new Map<string, EnrollmentVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentVarianceStore implements EnrollmentVarianceStore {
  inner: EnrollmentVarianceStore;
  cache: cache.TtlCache<EnrollmentVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentVarianceStore,
    cacheValue: cache.TtlCache<EnrollmentVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentVariance | undefined {
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

  save(item: EnrollmentVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentVariance[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentVarianceStore(inner: EnrollmentVarianceStore, ttl: number, clockValue: clock.Clock): EnrollmentVarianceStore {
  return new CachedEnrollmentVarianceStore(inner, cache.newTtlCache<EnrollmentVariance>(512, ttl, clockValue), 0, 0);
}

/** Selects enrollment variances. Empty fields match all. */
export class EnrollmentVarianceQuery {
  unit: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minAttempts: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentVariance): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentVariance[]): EnrollmentVariance[] {
    const matched = collections.filter(items, (candidate: EnrollmentVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentVariances(store: EnrollmentVarianceStore, query: EnrollmentVarianceQuery): EnrollmentVariance[] {
  return query.apply(store.list());
}
