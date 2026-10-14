import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionSlot } from "./subscription-slot.js";

/** Keeps subscription slots by code. */
export interface SubscriptionSlotStore {
  find(code: string): SubscriptionSlot | undefined;
  save(item: SubscriptionSlot): void;
  remove(code: string): boolean;
  list(): SubscriptionSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionSlotStore implements SubscriptionSlotStore {
  items: Map<string, SubscriptionSlot>;
  order: string[];

  constructor(items: Map<string, SubscriptionSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionSlot): void {
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

  list(): SubscriptionSlot[] {
    const out: SubscriptionSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionSlotStore(): SubscriptionSlotStore {
  return new MemorySubscriptionSlotStore(new Map<string, SubscriptionSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionSlotStore implements SubscriptionSlotStore {
  inner: SubscriptionSlotStore;
  cache: cache.TtlCache<SubscriptionSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionSlotStore,
    cacheValue: cache.TtlCache<SubscriptionSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionSlot | undefined {
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

  save(item: SubscriptionSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionSlot[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionSlotStore(inner: SubscriptionSlotStore, ttl: number, clockValue: clock.Clock): SubscriptionSlotStore {
  return new CachedSubscriptionSlotStore(inner, cache.newTtlCache<SubscriptionSlot>(1024, ttl, clockValue), 0, 0);
}

/** Selects subscription slots. Empty fields match all. */
export class SubscriptionSlotQuery {
  label: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCeiling: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionSlot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionSlot[]): SubscriptionSlot[] {
    const matched = collections.filter(items, (candidate: SubscriptionSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionSlots(store: SubscriptionSlotStore, query: SubscriptionSlotQuery): SubscriptionSlot[] {
  return query.apply(store.list());
}
