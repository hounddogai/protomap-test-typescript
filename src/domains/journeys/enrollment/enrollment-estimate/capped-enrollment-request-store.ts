import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedEnrollmentRequest } from "./capped-enrollment-request.js";

/** Keeps capped enrollment requests by code. */
export interface CappedEnrollmentRequestStore {
  find(code: string): CappedEnrollmentRequest | undefined;
  save(item: CappedEnrollmentRequest): void;
  remove(code: string): boolean;
  list(): CappedEnrollmentRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedEnrollmentRequestStore implements CappedEnrollmentRequestStore {
  items: Map<string, CappedEnrollmentRequest>;
  order: string[];

  constructor(items: Map<string, CappedEnrollmentRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedEnrollmentRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedEnrollmentRequest): void {
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

  list(): CappedEnrollmentRequest[] {
    const out: CappedEnrollmentRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedEnrollmentRequestStore(): CappedEnrollmentRequestStore {
  return new MemoryCappedEnrollmentRequestStore(new Map<string, CappedEnrollmentRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedEnrollmentRequestStore implements CappedEnrollmentRequestStore {
  inner: CappedEnrollmentRequestStore;
  cache: cache.TtlCache<CappedEnrollmentRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedEnrollmentRequestStore,
    cacheValue: cache.TtlCache<CappedEnrollmentRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedEnrollmentRequest | undefined {
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

  save(item: CappedEnrollmentRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedEnrollmentRequest[] {
    return this.inner.list();
  }
}

export function newCachedCappedEnrollmentRequestStore(inner: CappedEnrollmentRequestStore, ttl: number, clockValue: clock.Clock): CappedEnrollmentRequestStore {
  return new CachedCappedEnrollmentRequestStore(
    inner,
    cache.newTtlCache<CappedEnrollmentRequest>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped enrollment requests. Empty fields match all. */
export class CappedEnrollmentRequestQuery {
  utmSource: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minDiscount: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedEnrollmentRequest): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedEnrollmentRequest[]): CappedEnrollmentRequest[] {
    const matched = collections.filter(items, (candidate: CappedEnrollmentRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedEnrollmentRequests(store: CappedEnrollmentRequestStore, query: CappedEnrollmentRequestQuery): CappedEnrollmentRequest[] {
  return query.apply(store.list());
}
