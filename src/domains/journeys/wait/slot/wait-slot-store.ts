import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitSlot } from "./wait-slot.js";

/** Keeps wait slots by code. */
export interface WaitSlotStore {
  find(code: string): WaitSlot | undefined;
  save(item: WaitSlot): void;
  remove(code: string): boolean;
  list(): WaitSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitSlotStore implements WaitSlotStore {
  items: Map<string, WaitSlot>;
  order: string[];

  constructor(items: Map<string, WaitSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitSlot): void {
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

  list(): WaitSlot[] {
    const out: WaitSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitSlotStore(): WaitSlotStore {
  return new MemoryWaitSlotStore(new Map<string, WaitSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitSlotStore implements WaitSlotStore {
  inner: WaitSlotStore;
  cache: cache.TtlCache<WaitSlot>;
  hits: number;
  misses: number;

  constructor(inner: WaitSlotStore, cacheValue: cache.TtlCache<WaitSlot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitSlot | undefined {
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

  save(item: WaitSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitSlot[] {
    return this.inner.list();
  }
}

export function newCachedWaitSlotStore(inner: WaitSlotStore, ttl: number, clockValue: clock.Clock): WaitSlotStore {
  return new CachedWaitSlotStore(inner, cache.newTtlCache<WaitSlot>(512, ttl, clockValue), 0, 0);
}

/** Selects wait slots. Empty fields match all. */
export class WaitSlotQuery {
  label: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitSlot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitSlot[]): WaitSlot[] {
    const matched = collections.filter(items, (candidate: WaitSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitSlots(store: WaitSlotStore, query: WaitSlotQuery): WaitSlot[] {
  return query.apply(store.list());
}
