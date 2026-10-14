import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckSlot } from "./fraud-check-slot.js";

/** Keeps fraud check slots by code. */
export interface FraudCheckSlotStore {
  find(code: string): FraudCheckSlot | undefined;
  save(item: FraudCheckSlot): void;
  remove(code: string): boolean;
  list(): FraudCheckSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckSlotStore implements FraudCheckSlotStore {
  items: Map<string, FraudCheckSlot>;
  order: string[];

  constructor(items: Map<string, FraudCheckSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckSlot): void {
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

  list(): FraudCheckSlot[] {
    const out: FraudCheckSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckSlotStore(): FraudCheckSlotStore {
  return new MemoryFraudCheckSlotStore(new Map<string, FraudCheckSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckSlotStore implements FraudCheckSlotStore {
  inner: FraudCheckSlotStore;
  cache: cache.TtlCache<FraudCheckSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckSlotStore,
    cacheValue: cache.TtlCache<FraudCheckSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckSlot | undefined {
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

  save(item: FraudCheckSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckSlot[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckSlotStore(inner: FraudCheckSlotStore, ttl: number, clockValue: clock.Clock): FraudCheckSlotStore {
  return new CachedFraudCheckSlotStore(inner, cache.newTtlCache<FraudCheckSlot>(1024, ttl, clockValue), 0, 0);
}

/** Selects fraud check slots. Empty fields match all. */
export class FraudCheckSlotQuery {
  segment: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckSlot): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckSlot[]): FraudCheckSlot[] {
    const matched = collections.filter(items, (candidate: FraudCheckSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckSlots(store: FraudCheckSlotStore, query: FraudCheckSlotQuery): FraudCheckSlot[] {
  return query.apply(store.list());
}
