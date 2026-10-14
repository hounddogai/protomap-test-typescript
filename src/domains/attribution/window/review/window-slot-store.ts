import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowSlot } from "./window-slot.js";

/** Keeps window slots by code. */
export interface WindowSlotStore {
  find(code: string): WindowSlot | undefined;
  save(item: WindowSlot): void;
  remove(code: string): boolean;
  list(): WindowSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowSlotStore implements WindowSlotStore {
  items: Map<string, WindowSlot>;
  order: string[];

  constructor(items: Map<string, WindowSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowSlot): void {
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

  list(): WindowSlot[] {
    const out: WindowSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowSlotStore(): WindowSlotStore {
  return new MemoryWindowSlotStore(new Map<string, WindowSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowSlotStore implements WindowSlotStore {
  inner: WindowSlotStore;
  cache: cache.TtlCache<WindowSlot>;
  hits: number;
  misses: number;

  constructor(inner: WindowSlotStore, cacheValue: cache.TtlCache<WindowSlot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowSlot | undefined {
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

  save(item: WindowSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowSlot[] {
    return this.inner.list();
  }
}

export function newCachedWindowSlotStore(inner: WindowSlotStore, ttl: number, clockValue: clock.Clock): WindowSlotStore {
  return new CachedWindowSlotStore(inner, cache.newTtlCache<WindowSlot>(128, ttl, clockValue), 0, 0);
}

/** Selects window slots. Empty fields match all. */
export class WindowSlotQuery {
  segment: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minSendAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WindowSlot): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowSlot[]): WindowSlot[] {
    const matched = collections.filter(items, (candidate: WindowSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowSlots(store: WindowSlotStore, query: WindowSlotQuery): WindowSlot[] {
  return query.apply(store.list());
}
