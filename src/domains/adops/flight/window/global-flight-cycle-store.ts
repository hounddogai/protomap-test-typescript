import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalFlightCycle } from "./global-flight-cycle.js";

/** Keeps global flight cycles by code. */
export interface GlobalFlightCycleStore {
  find(code: string): GlobalFlightCycle | undefined;
  save(item: GlobalFlightCycle): void;
  remove(code: string): boolean;
  list(): GlobalFlightCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalFlightCycleStore implements GlobalFlightCycleStore {
  items: Map<string, GlobalFlightCycle>;
  order: string[];

  constructor(items: Map<string, GlobalFlightCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalFlightCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalFlightCycle): void {
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

  list(): GlobalFlightCycle[] {
    const out: GlobalFlightCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalFlightCycleStore(): GlobalFlightCycleStore {
  return new MemoryGlobalFlightCycleStore(new Map<string, GlobalFlightCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalFlightCycleStore implements GlobalFlightCycleStore {
  inner: GlobalFlightCycleStore;
  cache: cache.TtlCache<GlobalFlightCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalFlightCycleStore,
    cacheValue: cache.TtlCache<GlobalFlightCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalFlightCycle | undefined {
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

  save(item: GlobalFlightCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalFlightCycle[] {
    return this.inner.list();
  }
}

export function newCachedGlobalFlightCycleStore(inner: GlobalFlightCycleStore, ttl: number, clockValue: clock.Clock): GlobalFlightCycleStore {
  return new CachedGlobalFlightCycleStore(inner, cache.newTtlCache<GlobalFlightCycle>(128, ttl, clockValue), 0, 0);
}

/** Selects global flight cycles. Empty fields match all. */
export class GlobalFlightCycleQuery {
  label: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBatchSize: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalFlightCycle): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalFlightCycle[]): GlobalFlightCycle[] {
    const matched = collections.filter(items, (candidate: GlobalFlightCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalFlightCycles(store: GlobalFlightCycleStore, query: GlobalFlightCycleQuery): GlobalFlightCycle[] {
  return query.apply(store.list());
}
