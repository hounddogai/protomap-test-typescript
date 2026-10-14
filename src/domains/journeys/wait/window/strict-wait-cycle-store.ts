import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictWaitCycle } from "./strict-wait-cycle.js";

/** Keeps strict wait cycles by code. */
export interface StrictWaitCycleStore {
  find(code: string): StrictWaitCycle | undefined;
  save(item: StrictWaitCycle): void;
  remove(code: string): boolean;
  list(): StrictWaitCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictWaitCycleStore implements StrictWaitCycleStore {
  items: Map<string, StrictWaitCycle>;
  order: string[];

  constructor(items: Map<string, StrictWaitCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictWaitCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictWaitCycle): void {
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

  list(): StrictWaitCycle[] {
    const out: StrictWaitCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictWaitCycleStore(): StrictWaitCycleStore {
  return new MemoryStrictWaitCycleStore(new Map<string, StrictWaitCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictWaitCycleStore implements StrictWaitCycleStore {
  inner: StrictWaitCycleStore;
  cache: cache.TtlCache<StrictWaitCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictWaitCycleStore,
    cacheValue: cache.TtlCache<StrictWaitCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictWaitCycle | undefined {
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

  save(item: StrictWaitCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictWaitCycle[] {
    return this.inner.list();
  }
}

export function newCachedStrictWaitCycleStore(inner: StrictWaitCycleStore, ttl: number, clockValue: clock.Clock): StrictWaitCycleStore {
  return new CachedStrictWaitCycleStore(inner, cache.newTtlCache<StrictWaitCycle>(1024, ttl, clockValue), 0, 0);
}

/** Selects strict wait cycles. Empty fields match all. */
export class StrictWaitCycleQuery {
  segment: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minRate: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictWaitCycle): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictWaitCycle[]): StrictWaitCycle[] {
    const matched = collections.filter(items, (candidate: StrictWaitCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictWaitCycles(store: StrictWaitCycleStore, query: StrictWaitCycleQuery): StrictWaitCycle[] {
  return query.apply(store.list());
}
