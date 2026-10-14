import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInRequest } from "./double-opt-in-request.js";

/** Keeps double opt in requests by code. */
export interface DoubleOptInRequestStore {
  find(code: string): DoubleOptInRequest | undefined;
  save(item: DoubleOptInRequest): void;
  remove(code: string): boolean;
  list(): DoubleOptInRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInRequestStore implements DoubleOptInRequestStore {
  items: Map<string, DoubleOptInRequest>;
  order: string[];

  constructor(items: Map<string, DoubleOptInRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInRequest): void {
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

  list(): DoubleOptInRequest[] {
    const out: DoubleOptInRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInRequestStore(): DoubleOptInRequestStore {
  return new MemoryDoubleOptInRequestStore(new Map<string, DoubleOptInRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInRequestStore implements DoubleOptInRequestStore {
  inner: DoubleOptInRequestStore;
  cache: cache.TtlCache<DoubleOptInRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInRequestStore,
    cacheValue: cache.TtlCache<DoubleOptInRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInRequest | undefined {
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

  save(item: DoubleOptInRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInRequest[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInRequestStore(inner: DoubleOptInRequestStore, ttl: number, clockValue: clock.Clock): DoubleOptInRequestStore {
  return new CachedDoubleOptInRequestStore(inner, cache.newTtlCache<DoubleOptInRequest>(1024, ttl, clockValue), 0, 0);
}

/** Selects double opt in requests. Empty fields match all. */
export class DoubleOptInRequestQuery {
  locale: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInRequest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInRequest[]): DoubleOptInRequest[] {
    const matched = collections.filter(items, (candidate: DoubleOptInRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInRequests(store: DoubleOptInRequestStore, query: DoubleOptInRequestQuery): DoubleOptInRequest[] {
  return query.apply(store.list());
}
