import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingPostCycle } from "./pending-post-cycle.js";

/** Keeps pending post cycles by code. */
export interface PendingPostCycleStore {
  find(code: string): PendingPostCycle | undefined;
  save(item: PendingPostCycle): void;
  remove(code: string): boolean;
  list(): PendingPostCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingPostCycleStore implements PendingPostCycleStore {
  items: Map<string, PendingPostCycle>;
  order: string[];

  constructor(items: Map<string, PendingPostCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingPostCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingPostCycle): void {
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

  list(): PendingPostCycle[] {
    const out: PendingPostCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingPostCycleStore(): PendingPostCycleStore {
  return new MemoryPendingPostCycleStore(new Map<string, PendingPostCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingPostCycleStore implements PendingPostCycleStore {
  inner: PendingPostCycleStore;
  cache: cache.TtlCache<PendingPostCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingPostCycleStore,
    cacheValue: cache.TtlCache<PendingPostCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingPostCycle | undefined {
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

  save(item: PendingPostCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingPostCycle[] {
    return this.inner.list();
  }
}

export function newCachedPendingPostCycleStore(inner: PendingPostCycleStore, ttl: number, clockValue: clock.Clock): PendingPostCycleStore {
  return new CachedPendingPostCycleStore(inner, cache.newTtlCache<PendingPostCycle>(128, ttl, clockValue), 0, 0);
}

/** Selects pending post cycles. Empty fields match all. */
export class PendingPostCycleQuery {
  country: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minStartsAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingPostCycle): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingPostCycle[]): PendingPostCycle[] {
    const matched = collections.filter(items, (candidate: PendingPostCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingPostCycles(store: PendingPostCycleStore, query: PendingPostCycleQuery): PendingPostCycle[] {
  return query.apply(store.list());
}
