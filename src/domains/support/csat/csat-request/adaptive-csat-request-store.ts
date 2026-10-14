import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveCsatRequest } from "./adaptive-csat-request.js";

/** Keeps adaptive csat requests by code. */
export interface AdaptiveCsatRequestStore {
  find(code: string): AdaptiveCsatRequest | undefined;
  save(item: AdaptiveCsatRequest): void;
  remove(code: string): boolean;
  list(): AdaptiveCsatRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveCsatRequestStore implements AdaptiveCsatRequestStore {
  items: Map<string, AdaptiveCsatRequest>;
  order: string[];

  constructor(items: Map<string, AdaptiveCsatRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveCsatRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveCsatRequest): void {
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

  list(): AdaptiveCsatRequest[] {
    const out: AdaptiveCsatRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveCsatRequestStore(): AdaptiveCsatRequestStore {
  return new MemoryAdaptiveCsatRequestStore(new Map<string, AdaptiveCsatRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveCsatRequestStore implements AdaptiveCsatRequestStore {
  inner: AdaptiveCsatRequestStore;
  cache: cache.TtlCache<AdaptiveCsatRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveCsatRequestStore,
    cacheValue: cache.TtlCache<AdaptiveCsatRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveCsatRequest | undefined {
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

  save(item: AdaptiveCsatRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveCsatRequest[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveCsatRequestStore(inner: AdaptiveCsatRequestStore, ttl: number, clockValue: clock.Clock): AdaptiveCsatRequestStore {
  return new CachedAdaptiveCsatRequestStore(inner, cache.newTtlCache<AdaptiveCsatRequest>(256, ttl, clockValue), 0, 0);
}

/** Selects adaptive csat requests. Empty fields match all. */
export class AdaptiveCsatRequestQuery {
  source: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minGraceDays: number, statuses: string[], limit: number) {
    this.source = source;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveCsatRequest): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveCsatRequest[]): AdaptiveCsatRequest[] {
    const matched = collections.filter(items, (candidate: AdaptiveCsatRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveCsatRequests(store: AdaptiveCsatRequestStore, query: AdaptiveCsatRequestQuery): AdaptiveCsatRequest[] {
  return query.apply(store.list());
}
