import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredPlacementException } from "./tiered-placement-exception.js";

/** Keeps tiered placement exceptions by code. */
export interface TieredPlacementExceptionStore {
  find(code: string): TieredPlacementException | undefined;
  save(item: TieredPlacementException): void;
  remove(code: string): boolean;
  list(): TieredPlacementException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredPlacementExceptionStore implements TieredPlacementExceptionStore {
  items: Map<string, TieredPlacementException>;
  order: string[];

  constructor(items: Map<string, TieredPlacementException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredPlacementException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredPlacementException): void {
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

  list(): TieredPlacementException[] {
    const out: TieredPlacementException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredPlacementExceptionStore(): TieredPlacementExceptionStore {
  return new MemoryTieredPlacementExceptionStore(new Map<string, TieredPlacementException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredPlacementExceptionStore implements TieredPlacementExceptionStore {
  inner: TieredPlacementExceptionStore;
  cache: cache.TtlCache<TieredPlacementException>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredPlacementExceptionStore,
    cacheValue: cache.TtlCache<TieredPlacementException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredPlacementException | undefined {
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

  save(item: TieredPlacementException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredPlacementException[] {
    return this.inner.list();
  }
}

export function newCachedTieredPlacementExceptionStore(inner: TieredPlacementExceptionStore, ttl: number, clockValue: clock.Clock): TieredPlacementExceptionStore {
  return new CachedTieredPlacementExceptionStore(
    inner,
    cache.newTtlCache<TieredPlacementException>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered placement exceptions. Empty fields match all. */
export class TieredPlacementExceptionQuery {
  source: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minCapacity: number, statuses: string[], limit: number) {
    this.source = source;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredPlacementException): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredPlacementException[]): TieredPlacementException[] {
    const matched = collections.filter(items, (candidate: TieredPlacementException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredPlacementExceptions(store: TieredPlacementExceptionStore, query: TieredPlacementExceptionQuery): TieredPlacementException[] {
  return query.apply(store.list());
}
