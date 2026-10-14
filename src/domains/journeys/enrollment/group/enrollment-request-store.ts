import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentRequest } from "./enrollment-request.js";

/** Keeps enrollment requests by code. */
export interface EnrollmentRequestStore {
  find(code: string): EnrollmentRequest | undefined;
  save(item: EnrollmentRequest): void;
  remove(code: string): boolean;
  list(): EnrollmentRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentRequestStore implements EnrollmentRequestStore {
  items: Map<string, EnrollmentRequest>;
  order: string[];

  constructor(items: Map<string, EnrollmentRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentRequest): void {
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

  list(): EnrollmentRequest[] {
    const out: EnrollmentRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentRequestStore(): EnrollmentRequestStore {
  return new MemoryEnrollmentRequestStore(new Map<string, EnrollmentRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentRequestStore implements EnrollmentRequestStore {
  inner: EnrollmentRequestStore;
  cache: cache.TtlCache<EnrollmentRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentRequestStore,
    cacheValue: cache.TtlCache<EnrollmentRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentRequest | undefined {
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

  save(item: EnrollmentRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentRequest[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentRequestStore(inner: EnrollmentRequestStore, ttl: number, clockValue: clock.Clock): EnrollmentRequestStore {
  return new CachedEnrollmentRequestStore(inner, cache.newTtlCache<EnrollmentRequest>(64, ttl, clockValue), 0, 0);
}

/** Selects enrollment requests. Empty fields match all. */
export class EnrollmentRequestQuery {
  locale: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCapacity: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentRequest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentRequest[]): EnrollmentRequest[] {
    const matched = collections.filter(items, (candidate: EnrollmentRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentRequests(store: EnrollmentRequestStore, query: EnrollmentRequestQuery): EnrollmentRequest[] {
  return query.apply(store.list());
}
