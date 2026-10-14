import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredLevelRequest } from "./tiered-level-request.js";

/** Keeps tiered level requests by code. */
export interface TieredLevelRequestStore {
  find(code: string): TieredLevelRequest | undefined;
  save(item: TieredLevelRequest): void;
  remove(code: string): boolean;
  list(): TieredLevelRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredLevelRequestStore implements TieredLevelRequestStore {
  items: Map<string, TieredLevelRequest>;
  order: string[];

  constructor(items: Map<string, TieredLevelRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredLevelRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredLevelRequest): void {
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

  list(): TieredLevelRequest[] {
    const out: TieredLevelRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredLevelRequestStore(): TieredLevelRequestStore {
  return new MemoryTieredLevelRequestStore(new Map<string, TieredLevelRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredLevelRequestStore implements TieredLevelRequestStore {
  inner: TieredLevelRequestStore;
  cache: cache.TtlCache<TieredLevelRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredLevelRequestStore,
    cacheValue: cache.TtlCache<TieredLevelRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredLevelRequest | undefined {
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

  save(item: TieredLevelRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredLevelRequest[] {
    return this.inner.list();
  }
}

export function newCachedTieredLevelRequestStore(inner: TieredLevelRequestStore, ttl: number, clockValue: clock.Clock): TieredLevelRequestStore {
  return new CachedTieredLevelRequestStore(inner, cache.newTtlCache<TieredLevelRequest>(128, ttl, clockValue), 0, 0);
}

/** Selects tiered level requests. Empty fields match all. */
export class TieredLevelRequestQuery {
  category: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredLevelRequest): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredLevelRequest[]): TieredLevelRequest[] {
    const matched = collections.filter(items, (candidate: TieredLevelRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredLevelRequests(store: TieredLevelRequestStore, query: TieredLevelRequestQuery): TieredLevelRequest[] {
  return query.apply(store.list());
}
