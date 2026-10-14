import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceSlot } from "./bounce-slot.js";

/** Keeps bounce slots by code. */
export interface BounceSlotStore {
  find(code: string): BounceSlot | undefined;
  save(item: BounceSlot): void;
  remove(code: string): boolean;
  list(): BounceSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceSlotStore implements BounceSlotStore {
  items: Map<string, BounceSlot>;
  order: string[];

  constructor(items: Map<string, BounceSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceSlot): void {
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

  list(): BounceSlot[] {
    const out: BounceSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceSlotStore(): BounceSlotStore {
  return new MemoryBounceSlotStore(new Map<string, BounceSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceSlotStore implements BounceSlotStore {
  inner: BounceSlotStore;
  cache: cache.TtlCache<BounceSlot>;
  hits: number;
  misses: number;

  constructor(inner: BounceSlotStore, cacheValue: cache.TtlCache<BounceSlot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceSlot | undefined {
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

  save(item: BounceSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceSlot[] {
    return this.inner.list();
  }
}

export function newCachedBounceSlotStore(inner: BounceSlotStore, ttl: number, clockValue: clock.Clock): BounceSlotStore {
  return new CachedBounceSlotStore(inner, cache.newTtlCache<BounceSlot>(512, ttl, clockValue), 0, 0);
}

/** Selects bounce slots. Empty fields match all. */
export class BounceSlotQuery {
  locale: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRetries: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceSlot): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceSlot[]): BounceSlot[] {
    const matched = collections.filter(items, (candidate: BounceSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceSlots(store: BounceSlotStore, query: BounceSlotQuery): BounceSlot[] {
  return query.apply(store.list());
}
