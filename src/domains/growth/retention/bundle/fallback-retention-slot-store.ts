import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackRetentionSlot } from "./fallback-retention-slot.js";

/** Keeps fallback retention slots by code. */
export interface FallbackRetentionSlotStore {
  find(code: string): FallbackRetentionSlot | undefined;
  save(item: FallbackRetentionSlot): void;
  remove(code: string): boolean;
  list(): FallbackRetentionSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackRetentionSlotStore implements FallbackRetentionSlotStore {
  items: Map<string, FallbackRetentionSlot>;
  order: string[];

  constructor(items: Map<string, FallbackRetentionSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackRetentionSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackRetentionSlot): void {
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

  list(): FallbackRetentionSlot[] {
    const out: FallbackRetentionSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackRetentionSlotStore(): FallbackRetentionSlotStore {
  return new MemoryFallbackRetentionSlotStore(new Map<string, FallbackRetentionSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackRetentionSlotStore implements FallbackRetentionSlotStore {
  inner: FallbackRetentionSlotStore;
  cache: cache.TtlCache<FallbackRetentionSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackRetentionSlotStore,
    cacheValue: cache.TtlCache<FallbackRetentionSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackRetentionSlot | undefined {
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

  save(item: FallbackRetentionSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackRetentionSlot[] {
    return this.inner.list();
  }
}

export function newCachedFallbackRetentionSlotStore(inner: FallbackRetentionSlotStore, ttl: number, clockValue: clock.Clock): FallbackRetentionSlotStore {
  return new CachedFallbackRetentionSlotStore(
    inner,
    cache.newTtlCache<FallbackRetentionSlot>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback retention slots. Empty fields match all. */
export class FallbackRetentionSlotQuery {
  unit: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minQuantity: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackRetentionSlot): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackRetentionSlot[]): FallbackRetentionSlot[] {
    const matched = collections.filter(items, (candidate: FallbackRetentionSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackRetentionSlots(store: FallbackRetentionSlotStore, query: FallbackRetentionSlotQuery): FallbackRetentionSlot[] {
  return query.apply(store.list());
}
