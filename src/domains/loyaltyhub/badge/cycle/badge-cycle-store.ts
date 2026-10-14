import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BadgeCycle } from "./badge-cycle.js";

/** Keeps badge cycles by code. */
export interface BadgeCycleStore {
  find(code: string): BadgeCycle | undefined;
  save(item: BadgeCycle): void;
  remove(code: string): boolean;
  list(): BadgeCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBadgeCycleStore implements BadgeCycleStore {
  items: Map<string, BadgeCycle>;
  order: string[];

  constructor(items: Map<string, BadgeCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BadgeCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BadgeCycle): void {
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

  list(): BadgeCycle[] {
    const out: BadgeCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBadgeCycleStore(): BadgeCycleStore {
  return new MemoryBadgeCycleStore(new Map<string, BadgeCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBadgeCycleStore implements BadgeCycleStore {
  inner: BadgeCycleStore;
  cache: cache.TtlCache<BadgeCycle>;
  hits: number;
  misses: number;

  constructor(inner: BadgeCycleStore, cacheValue: cache.TtlCache<BadgeCycle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BadgeCycle | undefined {
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

  save(item: BadgeCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BadgeCycle[] {
    return this.inner.list();
  }
}

export function newCachedBadgeCycleStore(inner: BadgeCycleStore, ttl: number, clockValue: clock.Clock): BadgeCycleStore {
  return new CachedBadgeCycleStore(inner, cache.newTtlCache<BadgeCycle>(256, ttl, clockValue), 0, 0);
}

/** Selects badge cycles. Empty fields match all. */
export class BadgeCycleQuery {
  region: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minMinimum: number, statuses: string[], limit: number) {
    this.region = region;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BadgeCycle): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BadgeCycle[]): BadgeCycle[] {
    const matched = collections.filter(items, (candidate: BadgeCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBadgeCycles(store: BadgeCycleStore, query: BadgeCycleQuery): BadgeCycle[] {
  return query.apply(store.list());
}
