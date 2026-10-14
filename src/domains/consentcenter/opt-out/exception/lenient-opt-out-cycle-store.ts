import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientOptOutCycle } from "./lenient-opt-out-cycle.js";

/** Keeps lenient opt out cycles by code. */
export interface LenientOptOutCycleStore {
  find(code: string): LenientOptOutCycle | undefined;
  save(item: LenientOptOutCycle): void;
  remove(code: string): boolean;
  list(): LenientOptOutCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientOptOutCycleStore implements LenientOptOutCycleStore {
  items: Map<string, LenientOptOutCycle>;
  order: string[];

  constructor(items: Map<string, LenientOptOutCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientOptOutCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientOptOutCycle): void {
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

  list(): LenientOptOutCycle[] {
    const out: LenientOptOutCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientOptOutCycleStore(): LenientOptOutCycleStore {
  return new MemoryLenientOptOutCycleStore(new Map<string, LenientOptOutCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientOptOutCycleStore implements LenientOptOutCycleStore {
  inner: LenientOptOutCycleStore;
  cache: cache.TtlCache<LenientOptOutCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientOptOutCycleStore,
    cacheValue: cache.TtlCache<LenientOptOutCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientOptOutCycle | undefined {
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

  save(item: LenientOptOutCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientOptOutCycle[] {
    return this.inner.list();
  }
}

export function newCachedLenientOptOutCycleStore(inner: LenientOptOutCycleStore, ttl: number, clockValue: clock.Clock): LenientOptOutCycleStore {
  return new CachedLenientOptOutCycleStore(inner, cache.newTtlCache<LenientOptOutCycle>(256, ttl, clockValue), 0, 0);
}

/** Selects lenient opt out cycles. Empty fields match all. */
export class LenientOptOutCycleQuery {
  country: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientOptOutCycle): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientOptOutCycle[]): LenientOptOutCycle[] {
    const matched = collections.filter(items, (candidate: LenientOptOutCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientOptOutCycles(store: LenientOptOutCycleStore, query: LenientOptOutCycleQuery): LenientOptOutCycle[] {
  return query.apply(store.list());
}
