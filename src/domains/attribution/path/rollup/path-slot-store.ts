import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathSlot } from "./path-slot.js";

/** Keeps path slots by code. */
export interface PathSlotStore {
  find(code: string): PathSlot | undefined;
  save(item: PathSlot): void;
  remove(code: string): boolean;
  list(): PathSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathSlotStore implements PathSlotStore {
  items: Map<string, PathSlot>;
  order: string[];

  constructor(items: Map<string, PathSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathSlot): void {
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

  list(): PathSlot[] {
    const out: PathSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathSlotStore(): PathSlotStore {
  return new MemoryPathSlotStore(new Map<string, PathSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathSlotStore implements PathSlotStore {
  inner: PathSlotStore;
  cache: cache.TtlCache<PathSlot>;
  hits: number;
  misses: number;

  constructor(inner: PathSlotStore, cacheValue: cache.TtlCache<PathSlot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathSlot | undefined {
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

  save(item: PathSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathSlot[] {
    return this.inner.list();
  }
}

export function newCachedPathSlotStore(inner: PathSlotStore, ttl: number, clockValue: clock.Clock): PathSlotStore {
  return new CachedPathSlotStore(inner, cache.newTtlCache<PathSlot>(512, ttl, clockValue), 0, 0);
}

/** Selects path slots. Empty fields match all. */
export class PathSlotQuery {
  name: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minOpenRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathSlot): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathSlot[]): PathSlot[] {
    const matched = collections.filter(items, (candidate: PathSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathSlots(store: PathSlotStore, query: PathSlotQuery): PathSlot[] {
  return query.apply(store.list());
}
