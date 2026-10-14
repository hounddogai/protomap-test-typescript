import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalDeflectionCycle } from "./global-deflection-cycle.js";

/** Keeps global deflection cycles by code. */
export interface GlobalDeflectionCycleStore {
  find(code: string): GlobalDeflectionCycle | undefined;
  save(item: GlobalDeflectionCycle): void;
  remove(code: string): boolean;
  list(): GlobalDeflectionCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalDeflectionCycleStore implements GlobalDeflectionCycleStore {
  items: Map<string, GlobalDeflectionCycle>;
  order: string[];

  constructor(items: Map<string, GlobalDeflectionCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalDeflectionCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalDeflectionCycle): void {
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

  list(): GlobalDeflectionCycle[] {
    const out: GlobalDeflectionCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalDeflectionCycleStore(): GlobalDeflectionCycleStore {
  return new MemoryGlobalDeflectionCycleStore(new Map<string, GlobalDeflectionCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalDeflectionCycleStore implements GlobalDeflectionCycleStore {
  inner: GlobalDeflectionCycleStore;
  cache: cache.TtlCache<GlobalDeflectionCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalDeflectionCycleStore,
    cacheValue: cache.TtlCache<GlobalDeflectionCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalDeflectionCycle | undefined {
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

  save(item: GlobalDeflectionCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalDeflectionCycle[] {
    return this.inner.list();
  }
}

export function newCachedGlobalDeflectionCycleStore(inner: GlobalDeflectionCycleStore, ttl: number, clockValue: clock.Clock): GlobalDeflectionCycleStore {
  return new CachedGlobalDeflectionCycleStore(
    inner,
    cache.newTtlCache<GlobalDeflectionCycle>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global deflection cycles. Empty fields match all. */
export class GlobalDeflectionCycleQuery {
  country: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minAttempts: number, statuses: string[], limit: number) {
    this.country = country;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalDeflectionCycle): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalDeflectionCycle[]): GlobalDeflectionCycle[] {
    const matched = collections.filter(items, (candidate: GlobalDeflectionCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalDeflectionCycles(store: GlobalDeflectionCycleStore, query: GlobalDeflectionCycleQuery): GlobalDeflectionCycle[] {
  return query.apply(store.list());
}
