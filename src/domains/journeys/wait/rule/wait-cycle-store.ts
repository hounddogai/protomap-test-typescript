import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitCycle } from "./wait-cycle.js";

/** Keeps wait cycles by code. */
export interface WaitCycleStore {
  find(code: string): WaitCycle | undefined;
  save(item: WaitCycle): void;
  remove(code: string): boolean;
  list(): WaitCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitCycleStore implements WaitCycleStore {
  items: Map<string, WaitCycle>;
  order: string[];

  constructor(items: Map<string, WaitCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitCycle): void {
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

  list(): WaitCycle[] {
    const out: WaitCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitCycleStore(): WaitCycleStore {
  return new MemoryWaitCycleStore(new Map<string, WaitCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitCycleStore implements WaitCycleStore {
  inner: WaitCycleStore;
  cache: cache.TtlCache<WaitCycle>;
  hits: number;
  misses: number;

  constructor(inner: WaitCycleStore, cacheValue: cache.TtlCache<WaitCycle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitCycle | undefined {
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

  save(item: WaitCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitCycle[] {
    return this.inner.list();
  }
}

export function newCachedWaitCycleStore(inner: WaitCycleStore, ttl: number, clockValue: clock.Clock): WaitCycleStore {
  return new CachedWaitCycleStore(inner, cache.newTtlCache<WaitCycle>(1024, ttl, clockValue), 0, 0);
}

/** Selects wait cycles. Empty fields match all. */
export class WaitCycleQuery {
  title: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitCycle): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitCycle[]): WaitCycle[] {
    const matched = collections.filter(items, (candidate: WaitCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitCycles(store: WaitCycleStore, query: WaitCycleQuery): WaitCycle[] {
  return query.apply(store.list());
}
