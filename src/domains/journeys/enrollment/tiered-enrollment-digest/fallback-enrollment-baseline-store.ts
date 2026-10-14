import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackEnrollmentBaseline } from "./fallback-enrollment-baseline.js";

/** Keeps fallback enrollment baselines by code. */
export interface FallbackEnrollmentBaselineStore {
  find(code: string): FallbackEnrollmentBaseline | undefined;
  save(item: FallbackEnrollmentBaseline): void;
  remove(code: string): boolean;
  list(): FallbackEnrollmentBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackEnrollmentBaselineStore implements FallbackEnrollmentBaselineStore {
  items: Map<string, FallbackEnrollmentBaseline>;
  order: string[];

  constructor(items: Map<string, FallbackEnrollmentBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackEnrollmentBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackEnrollmentBaseline): void {
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

  list(): FallbackEnrollmentBaseline[] {
    const out: FallbackEnrollmentBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackEnrollmentBaselineStore(): FallbackEnrollmentBaselineStore {
  return new MemoryFallbackEnrollmentBaselineStore(new Map<string, FallbackEnrollmentBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackEnrollmentBaselineStore implements FallbackEnrollmentBaselineStore {
  inner: FallbackEnrollmentBaselineStore;
  cache: cache.TtlCache<FallbackEnrollmentBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackEnrollmentBaselineStore,
    cacheValue: cache.TtlCache<FallbackEnrollmentBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackEnrollmentBaseline | undefined {
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

  save(item: FallbackEnrollmentBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackEnrollmentBaseline[] {
    return this.inner.list();
  }
}

export function newCachedFallbackEnrollmentBaselineStore(inner: FallbackEnrollmentBaselineStore, ttl: number, clockValue: clock.Clock): FallbackEnrollmentBaselineStore {
  return new CachedFallbackEnrollmentBaselineStore(
    inner,
    cache.newTtlCache<FallbackEnrollmentBaseline>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback enrollment baselines. Empty fields match all. */
export class FallbackEnrollmentBaselineQuery {
  category: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minMinimum: number, statuses: string[], limit: number) {
    this.category = category;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackEnrollmentBaseline): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackEnrollmentBaseline[]): FallbackEnrollmentBaseline[] {
    const matched = collections.filter(items, (candidate: FallbackEnrollmentBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackEnrollmentBaselines(store: FallbackEnrollmentBaselineStore, query: FallbackEnrollmentBaselineQuery): FallbackEnrollmentBaseline[] {
  return query.apply(store.list());
}
