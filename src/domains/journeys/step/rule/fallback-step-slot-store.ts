import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackStepSlot } from "./fallback-step-slot.js";

/** Keeps fallback step slots by code. */
export interface FallbackStepSlotStore {
  find(code: string): FallbackStepSlot | undefined;
  save(item: FallbackStepSlot): void;
  remove(code: string): boolean;
  list(): FallbackStepSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackStepSlotStore implements FallbackStepSlotStore {
  items: Map<string, FallbackStepSlot>;
  order: string[];

  constructor(items: Map<string, FallbackStepSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackStepSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackStepSlot): void {
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

  list(): FallbackStepSlot[] {
    const out: FallbackStepSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackStepSlotStore(): FallbackStepSlotStore {
  return new MemoryFallbackStepSlotStore(new Map<string, FallbackStepSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackStepSlotStore implements FallbackStepSlotStore {
  inner: FallbackStepSlotStore;
  cache: cache.TtlCache<FallbackStepSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackStepSlotStore,
    cacheValue: cache.TtlCache<FallbackStepSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackStepSlot | undefined {
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

  save(item: FallbackStepSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackStepSlot[] {
    return this.inner.list();
  }
}

export function newCachedFallbackStepSlotStore(inner: FallbackStepSlotStore, ttl: number, clockValue: clock.Clock): FallbackStepSlotStore {
  return new CachedFallbackStepSlotStore(inner, cache.newTtlCache<FallbackStepSlot>(1024, ttl, clockValue), 0, 0);
}

/** Selects fallback step slots. Empty fields match all. */
export class FallbackStepSlotQuery {
  unit: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minDiscount: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackStepSlot): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackStepSlot[]): FallbackStepSlot[] {
    const matched = collections.filter(items, (candidate: FallbackStepSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackStepSlots(store: FallbackStepSlotStore, query: FallbackStepSlotQuery): FallbackStepSlot[] {
  return query.apply(store.list());
}
