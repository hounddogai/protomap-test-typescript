import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelRollup } from "./funnel-rollup.js";

/** Keeps funnel rollups by code. */
export interface FunnelRollupStore {
  find(code: string): FunnelRollup | undefined;
  save(item: FunnelRollup): void;
  remove(code: string): boolean;
  list(): FunnelRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelRollupStore implements FunnelRollupStore {
  items: Map<string, FunnelRollup>;
  order: string[];

  constructor(items: Map<string, FunnelRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelRollup): void {
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

  list(): FunnelRollup[] {
    const out: FunnelRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelRollupStore(): FunnelRollupStore {
  return new MemoryFunnelRollupStore(new Map<string, FunnelRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelRollupStore implements FunnelRollupStore {
  inner: FunnelRollupStore;
  cache: cache.TtlCache<FunnelRollup>;
  hits: number;
  misses: number;

  constructor(inner: FunnelRollupStore, cacheValue: cache.TtlCache<FunnelRollup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelRollup | undefined {
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

  save(item: FunnelRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelRollup[] {
    return this.inner.list();
  }
}

export function newCachedFunnelRollupStore(inner: FunnelRollupStore, ttl: number, clockValue: clock.Clock): FunnelRollupStore {
  return new CachedFunnelRollupStore(inner, cache.newTtlCache<FunnelRollup>(1024, ttl, clockValue), 0, 0);
}

/** Selects funnel rollups. Empty fields match all. */
export class FunnelRollupQuery {
  category: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minAttempts: number, statuses: string[], limit: number) {
    this.category = category;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelRollup): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelRollup[]): FunnelRollup[] {
    const matched = collections.filter(items, (candidate: FunnelRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelRollups(store: FunnelRollupStore, query: FunnelRollupQuery): FunnelRollup[] {
  return query.apply(store.list());
}
