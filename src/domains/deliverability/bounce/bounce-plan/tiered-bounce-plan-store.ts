import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredBouncePlan } from "./tiered-bounce-plan.js";

/** Keeps tiered bounce plans by code. */
export interface TieredBouncePlanStore {
  find(code: string): TieredBouncePlan | undefined;
  save(item: TieredBouncePlan): void;
  remove(code: string): boolean;
  list(): TieredBouncePlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredBouncePlanStore implements TieredBouncePlanStore {
  items: Map<string, TieredBouncePlan>;
  order: string[];

  constructor(items: Map<string, TieredBouncePlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredBouncePlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredBouncePlan): void {
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

  list(): TieredBouncePlan[] {
    const out: TieredBouncePlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredBouncePlanStore(): TieredBouncePlanStore {
  return new MemoryTieredBouncePlanStore(new Map<string, TieredBouncePlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredBouncePlanStore implements TieredBouncePlanStore {
  inner: TieredBouncePlanStore;
  cache: cache.TtlCache<TieredBouncePlan>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredBouncePlanStore,
    cacheValue: cache.TtlCache<TieredBouncePlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredBouncePlan | undefined {
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

  save(item: TieredBouncePlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredBouncePlan[] {
    return this.inner.list();
  }
}

export function newCachedTieredBouncePlanStore(inner: TieredBouncePlanStore, ttl: number, clockValue: clock.Clock): TieredBouncePlanStore {
  return new CachedTieredBouncePlanStore(inner, cache.newTtlCache<TieredBouncePlan>(64, ttl, clockValue), 0, 0);
}

/** Selects tiered bounce plans. Empty fields match all. */
export class TieredBouncePlanQuery {
  locale: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minFloorValue: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredBouncePlan): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredBouncePlan[]): TieredBouncePlan[] {
    const matched = collections.filter(items, (candidate: TieredBouncePlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredBouncePlans(store: TieredBouncePlanStore, query: TieredBouncePlanQuery): TieredBouncePlan[] {
  return query.apply(store.list());
}
