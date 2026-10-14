import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingSubscriptionSlot } from "./pending-subscription-slot.js";

/** Keeps pending subscription slots by code. */
export interface PendingSubscriptionSlotStore {
  find(code: string): PendingSubscriptionSlot | undefined;
  save(item: PendingSubscriptionSlot): void;
  remove(code: string): boolean;
  list(): PendingSubscriptionSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingSubscriptionSlotStore implements PendingSubscriptionSlotStore {
  items: Map<string, PendingSubscriptionSlot>;
  order: string[];

  constructor(items: Map<string, PendingSubscriptionSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingSubscriptionSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingSubscriptionSlot): void {
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

  list(): PendingSubscriptionSlot[] {
    const out: PendingSubscriptionSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingSubscriptionSlotStore(): PendingSubscriptionSlotStore {
  return new MemoryPendingSubscriptionSlotStore(new Map<string, PendingSubscriptionSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingSubscriptionSlotStore implements PendingSubscriptionSlotStore {
  inner: PendingSubscriptionSlotStore;
  cache: cache.TtlCache<PendingSubscriptionSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingSubscriptionSlotStore,
    cacheValue: cache.TtlCache<PendingSubscriptionSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingSubscriptionSlot | undefined {
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

  save(item: PendingSubscriptionSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingSubscriptionSlot[] {
    return this.inner.list();
  }
}

export function newCachedPendingSubscriptionSlotStore(inner: PendingSubscriptionSlotStore, ttl: number, clockValue: clock.Clock): PendingSubscriptionSlotStore {
  return new CachedPendingSubscriptionSlotStore(
    inner,
    cache.newTtlCache<PendingSubscriptionSlot>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending subscription slots. Empty fields match all. */
export class PendingSubscriptionSlotQuery {
  unit: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minLimit: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingSubscriptionSlot): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingSubscriptionSlot[]): PendingSubscriptionSlot[] {
    const matched = collections.filter(items, (candidate: PendingSubscriptionSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingSubscriptionSlots(store: PendingSubscriptionSlotStore, query: PendingSubscriptionSlotQuery): PendingSubscriptionSlot[] {
  return query.apply(store.list());
}
