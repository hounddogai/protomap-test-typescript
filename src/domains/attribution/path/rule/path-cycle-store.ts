import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathCycle } from "./path-cycle.js";

/** Keeps path cycles by code. */
export interface PathCycleStore {
  find(code: string): PathCycle | undefined;
  save(item: PathCycle): void;
  remove(code: string): boolean;
  list(): PathCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathCycleStore implements PathCycleStore {
  items: Map<string, PathCycle>;
  order: string[];

  constructor(items: Map<string, PathCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathCycle): void {
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

  list(): PathCycle[] {
    const out: PathCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathCycleStore(): PathCycleStore {
  return new MemoryPathCycleStore(new Map<string, PathCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathCycleStore implements PathCycleStore {
  inner: PathCycleStore;
  cache: cache.TtlCache<PathCycle>;
  hits: number;
  misses: number;

  constructor(inner: PathCycleStore, cacheValue: cache.TtlCache<PathCycle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathCycle | undefined {
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

  save(item: PathCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathCycle[] {
    return this.inner.list();
  }
}

export function newCachedPathCycleStore(inner: PathCycleStore, ttl: number, clockValue: clock.Clock): PathCycleStore {
  return new CachedPathCycleStore(inner, cache.newTtlCache<PathCycle>(1024, ttl, clockValue), 0, 0);
}

/** Selects path cycles. Empty fields match all. */
export class PathCycleQuery {
  channel: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minAmount: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathCycle): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathCycle[]): PathCycle[] {
    const matched = collections.filter(items, (candidate: PathCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathCycles(store: PathCycleStore, query: PathCycleQuery): PathCycle[] {
  return query.apply(store.list());
}
