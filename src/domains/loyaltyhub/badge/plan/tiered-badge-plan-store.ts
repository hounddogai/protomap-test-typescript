import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredBadgePlan } from "./tiered-badge-plan.js";

/** Keeps tiered badge plans by code. */
export interface TieredBadgePlanStore {
  find(code: string): TieredBadgePlan | undefined;
  save(item: TieredBadgePlan): void;
  remove(code: string): boolean;
  list(): TieredBadgePlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredBadgePlanStore implements TieredBadgePlanStore {
  items: Map<string, TieredBadgePlan>;
  order: string[];

  constructor(items: Map<string, TieredBadgePlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredBadgePlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredBadgePlan): void {
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

  list(): TieredBadgePlan[] {
    const out: TieredBadgePlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredBadgePlanStore(): TieredBadgePlanStore {
  return new MemoryTieredBadgePlanStore(new Map<string, TieredBadgePlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredBadgePlanStore implements TieredBadgePlanStore {
  inner: TieredBadgePlanStore;
  cache: cache.TtlCache<TieredBadgePlan>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredBadgePlanStore,
    cacheValue: cache.TtlCache<TieredBadgePlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredBadgePlan | undefined {
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

  save(item: TieredBadgePlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredBadgePlan[] {
    return this.inner.list();
  }
}

export function newCachedTieredBadgePlanStore(inner: TieredBadgePlanStore, ttl: number, clockValue: clock.Clock): TieredBadgePlanStore {
  return new CachedTieredBadgePlanStore(inner, cache.newTtlCache<TieredBadgePlan>(256, ttl, clockValue), 0, 0);
}

/** Selects tiered badge plans. Empty fields match all. */
export class TieredBadgePlanQuery {
  name: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAttempts: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredBadgePlan): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredBadgePlan[]): TieredBadgePlan[] {
    const matched = collections.filter(items, (candidate: TieredBadgePlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredBadgePlans(store: TieredBadgePlanStore, query: TieredBadgePlanQuery): TieredBadgePlan[] {
  return query.apply(store.list());
}
