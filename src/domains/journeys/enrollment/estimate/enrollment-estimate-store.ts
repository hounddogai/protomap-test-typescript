import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentEstimate } from "./enrollment-estimate.js";

/** Keeps enrollment estimates by code. */
export interface EnrollmentEstimateStore {
  find(code: string): EnrollmentEstimate | undefined;
  save(item: EnrollmentEstimate): void;
  remove(code: string): boolean;
  list(): EnrollmentEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentEstimateStore implements EnrollmentEstimateStore {
  items: Map<string, EnrollmentEstimate>;
  order: string[];

  constructor(items: Map<string, EnrollmentEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentEstimate): void {
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

  list(): EnrollmentEstimate[] {
    const out: EnrollmentEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentEstimateStore(): EnrollmentEstimateStore {
  return new MemoryEnrollmentEstimateStore(new Map<string, EnrollmentEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentEstimateStore implements EnrollmentEstimateStore {
  inner: EnrollmentEstimateStore;
  cache: cache.TtlCache<EnrollmentEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentEstimateStore,
    cacheValue: cache.TtlCache<EnrollmentEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentEstimate | undefined {
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

  save(item: EnrollmentEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentEstimate[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentEstimateStore(inner: EnrollmentEstimateStore, ttl: number, clockValue: clock.Clock): EnrollmentEstimateStore {
  return new CachedEnrollmentEstimateStore(inner, cache.newTtlCache<EnrollmentEstimate>(1024, ttl, clockValue), 0, 0);
}

/** Selects enrollment estimates. Empty fields match all. */
export class EnrollmentEstimateQuery {
  label: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAttempts: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentEstimate): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentEstimate[]): EnrollmentEstimate[] {
    const matched = collections.filter(items, (candidate: EnrollmentEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentEstimates(store: EnrollmentEstimateStore, query: EnrollmentEstimateQuery): EnrollmentEstimate[] {
  return query.apply(store.list());
}
