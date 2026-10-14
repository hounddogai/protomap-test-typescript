import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentBaseline } from "./enrollment-baseline.js";

/** Keeps enrollment baselines by code. */
export interface EnrollmentBaselineStore {
  find(code: string): EnrollmentBaseline | undefined;
  save(item: EnrollmentBaseline): void;
  remove(code: string): boolean;
  list(): EnrollmentBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentBaselineStore implements EnrollmentBaselineStore {
  items: Map<string, EnrollmentBaseline>;
  order: string[];

  constructor(items: Map<string, EnrollmentBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentBaseline): void {
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

  list(): EnrollmentBaseline[] {
    const out: EnrollmentBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentBaselineStore(): EnrollmentBaselineStore {
  return new MemoryEnrollmentBaselineStore(new Map<string, EnrollmentBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentBaselineStore implements EnrollmentBaselineStore {
  inner: EnrollmentBaselineStore;
  cache: cache.TtlCache<EnrollmentBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentBaselineStore,
    cacheValue: cache.TtlCache<EnrollmentBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentBaseline | undefined {
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

  save(item: EnrollmentBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentBaseline[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentBaselineStore(inner: EnrollmentBaselineStore, ttl: number, clockValue: clock.Clock): EnrollmentBaselineStore {
  return new CachedEnrollmentBaselineStore(inner, cache.newTtlCache<EnrollmentBaseline>(1024, ttl, clockValue), 0, 0);
}

/** Selects enrollment baselines. Empty fields match all. */
export class EnrollmentBaselineQuery {
  country: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minSendAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentBaseline): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentBaseline[]): EnrollmentBaseline[] {
    const matched = collections.filter(items, (candidate: EnrollmentBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentBaselines(store: EnrollmentBaselineStore, query: EnrollmentBaselineQuery): EnrollmentBaseline[] {
  return query.apply(store.list());
}
