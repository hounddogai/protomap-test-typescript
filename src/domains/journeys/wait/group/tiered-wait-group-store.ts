import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredWaitGroup } from "./tiered-wait-group.js";

/** Keeps tiered wait groups by code. */
export interface TieredWaitGroupStore {
  find(code: string): TieredWaitGroup | undefined;
  save(item: TieredWaitGroup): void;
  remove(code: string): boolean;
  list(): TieredWaitGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredWaitGroupStore implements TieredWaitGroupStore {
  items: Map<string, TieredWaitGroup>;
  order: string[];

  constructor(items: Map<string, TieredWaitGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredWaitGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredWaitGroup): void {
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

  list(): TieredWaitGroup[] {
    const out: TieredWaitGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredWaitGroupStore(): TieredWaitGroupStore {
  return new MemoryTieredWaitGroupStore(new Map<string, TieredWaitGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredWaitGroupStore implements TieredWaitGroupStore {
  inner: TieredWaitGroupStore;
  cache: cache.TtlCache<TieredWaitGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredWaitGroupStore,
    cacheValue: cache.TtlCache<TieredWaitGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredWaitGroup | undefined {
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

  save(item: TieredWaitGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredWaitGroup[] {
    return this.inner.list();
  }
}

export function newCachedTieredWaitGroupStore(inner: TieredWaitGroupStore, ttl: number, clockValue: clock.Clock): TieredWaitGroupStore {
  return new CachedTieredWaitGroupStore(inner, cache.newTtlCache<TieredWaitGroup>(64, ttl, clockValue), 0, 0);
}

/** Selects tiered wait groups. Empty fields match all. */
export class TieredWaitGroupQuery {
  country: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minMargin: number, statuses: string[], limit: number) {
    this.country = country;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredWaitGroup): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredWaitGroup[]): TieredWaitGroup[] {
    const matched = collections.filter(items, (candidate: TieredWaitGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredWaitGroups(store: TieredWaitGroupStore, query: TieredWaitGroupQuery): TieredWaitGroup[] {
  return query.apply(store.list());
}
