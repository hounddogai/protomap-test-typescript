import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredBounceRequest } from "./tiered-bounce-request.js";

/** Keeps tiered bounce requests by code. */
export interface TieredBounceRequestStore {
  find(code: string): TieredBounceRequest | undefined;
  save(item: TieredBounceRequest): void;
  remove(code: string): boolean;
  list(): TieredBounceRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredBounceRequestStore implements TieredBounceRequestStore {
  items: Map<string, TieredBounceRequest>;
  order: string[];

  constructor(items: Map<string, TieredBounceRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredBounceRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredBounceRequest): void {
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

  list(): TieredBounceRequest[] {
    const out: TieredBounceRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredBounceRequestStore(): TieredBounceRequestStore {
  return new MemoryTieredBounceRequestStore(new Map<string, TieredBounceRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredBounceRequestStore implements TieredBounceRequestStore {
  inner: TieredBounceRequestStore;
  cache: cache.TtlCache<TieredBounceRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredBounceRequestStore,
    cacheValue: cache.TtlCache<TieredBounceRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredBounceRequest | undefined {
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

  save(item: TieredBounceRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredBounceRequest[] {
    return this.inner.list();
  }
}

export function newCachedTieredBounceRequestStore(inner: TieredBounceRequestStore, ttl: number, clockValue: clock.Clock): TieredBounceRequestStore {
  return new CachedTieredBounceRequestStore(inner, cache.newTtlCache<TieredBounceRequest>(64, ttl, clockValue), 0, 0);
}

/** Selects tiered bounce requests. Empty fields match all. */
export class TieredBounceRequestQuery {
  category: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minConversionRate: number, statuses: string[], limit: number) {
    this.category = category;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredBounceRequest): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredBounceRequest[]): TieredBounceRequest[] {
    const matched = collections.filter(items, (candidate: TieredBounceRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredBounceRequests(store: TieredBounceRequestStore, query: TieredBounceRequestQuery): TieredBounceRequest[] {
  return query.apply(store.list());
}
