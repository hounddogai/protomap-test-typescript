import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimarySubscriptionSlot } from "./primary-subscription-slot.js";

/** Keeps primary subscription slots by code. */
export interface PrimarySubscriptionSlotStore {
  find(code: string): PrimarySubscriptionSlot | undefined;
  save(item: PrimarySubscriptionSlot): void;
  remove(code: string): boolean;
  list(): PrimarySubscriptionSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimarySubscriptionSlotStore implements PrimarySubscriptionSlotStore {
  items: Map<string, PrimarySubscriptionSlot>;
  order: string[];

  constructor(items: Map<string, PrimarySubscriptionSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimarySubscriptionSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimarySubscriptionSlot): void {
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

  list(): PrimarySubscriptionSlot[] {
    const out: PrimarySubscriptionSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimarySubscriptionSlotStore(): PrimarySubscriptionSlotStore {
  return new MemoryPrimarySubscriptionSlotStore(new Map<string, PrimarySubscriptionSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimarySubscriptionSlotStore implements PrimarySubscriptionSlotStore {
  inner: PrimarySubscriptionSlotStore;
  cache: cache.TtlCache<PrimarySubscriptionSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimarySubscriptionSlotStore,
    cacheValue: cache.TtlCache<PrimarySubscriptionSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimarySubscriptionSlot | undefined {
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

  save(item: PrimarySubscriptionSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimarySubscriptionSlot[] {
    return this.inner.list();
  }
}

export function newCachedPrimarySubscriptionSlotStore(inner: PrimarySubscriptionSlotStore, ttl: number, clockValue: clock.Clock): PrimarySubscriptionSlotStore {
  return new CachedPrimarySubscriptionSlotStore(
    inner,
    cache.newTtlCache<PrimarySubscriptionSlot>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary subscription slots. Empty fields match all. */
export class PrimarySubscriptionSlotQuery {
  title: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.title = title;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimarySubscriptionSlot): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimarySubscriptionSlot[]): PrimarySubscriptionSlot[] {
    const matched = collections.filter(items, (candidate: PrimarySubscriptionSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimarySubscriptionSlots(store: PrimarySubscriptionSlotStore, query: PrimarySubscriptionSlotQuery): PrimarySubscriptionSlot[] {
  return query.apply(store.list());
}
