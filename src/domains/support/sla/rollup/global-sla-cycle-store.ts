import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalSlaCycle } from "./global-sla-cycle.js";

/** Keeps global sla cycles by code. */
export interface GlobalSlaCycleStore {
  find(code: string): GlobalSlaCycle | undefined;
  save(item: GlobalSlaCycle): void;
  remove(code: string): boolean;
  list(): GlobalSlaCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalSlaCycleStore implements GlobalSlaCycleStore {
  items: Map<string, GlobalSlaCycle>;
  order: string[];

  constructor(items: Map<string, GlobalSlaCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalSlaCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalSlaCycle): void {
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

  list(): GlobalSlaCycle[] {
    const out: GlobalSlaCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalSlaCycleStore(): GlobalSlaCycleStore {
  return new MemoryGlobalSlaCycleStore(new Map<string, GlobalSlaCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalSlaCycleStore implements GlobalSlaCycleStore {
  inner: GlobalSlaCycleStore;
  cache: cache.TtlCache<GlobalSlaCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalSlaCycleStore,
    cacheValue: cache.TtlCache<GlobalSlaCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalSlaCycle | undefined {
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

  save(item: GlobalSlaCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalSlaCycle[] {
    return this.inner.list();
  }
}

export function newCachedGlobalSlaCycleStore(inner: GlobalSlaCycleStore, ttl: number, clockValue: clock.Clock): GlobalSlaCycleStore {
  return new CachedGlobalSlaCycleStore(inner, cache.newTtlCache<GlobalSlaCycle>(256, ttl, clockValue), 0, 0);
}

/** Selects global sla cycles. Empty fields match all. */
export class GlobalSlaCycleQuery {
  country: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minCeiling: number, statuses: string[], limit: number) {
    this.country = country;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalSlaCycle): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalSlaCycle[]): GlobalSlaCycle[] {
    const matched = collections.filter(items, (candidate: GlobalSlaCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalSlaCycles(store: GlobalSlaCycleStore, query: GlobalSlaCycleQuery): GlobalSlaCycle[] {
  return query.apply(store.list());
}
