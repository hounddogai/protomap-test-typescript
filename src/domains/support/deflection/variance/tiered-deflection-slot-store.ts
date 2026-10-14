import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredDeflectionSlot } from "./tiered-deflection-slot.js";

/** Keeps tiered deflection slots by code. */
export interface TieredDeflectionSlotStore {
  find(code: string): TieredDeflectionSlot | undefined;
  save(item: TieredDeflectionSlot): void;
  remove(code: string): boolean;
  list(): TieredDeflectionSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredDeflectionSlotStore implements TieredDeflectionSlotStore {
  items: Map<string, TieredDeflectionSlot>;
  order: string[];

  constructor(items: Map<string, TieredDeflectionSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredDeflectionSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredDeflectionSlot): void {
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

  list(): TieredDeflectionSlot[] {
    const out: TieredDeflectionSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredDeflectionSlotStore(): TieredDeflectionSlotStore {
  return new MemoryTieredDeflectionSlotStore(new Map<string, TieredDeflectionSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredDeflectionSlotStore implements TieredDeflectionSlotStore {
  inner: TieredDeflectionSlotStore;
  cache: cache.TtlCache<TieredDeflectionSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredDeflectionSlotStore,
    cacheValue: cache.TtlCache<TieredDeflectionSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredDeflectionSlot | undefined {
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

  save(item: TieredDeflectionSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredDeflectionSlot[] {
    return this.inner.list();
  }
}

export function newCachedTieredDeflectionSlotStore(inner: TieredDeflectionSlotStore, ttl: number, clockValue: clock.Clock): TieredDeflectionSlotStore {
  return new CachedTieredDeflectionSlotStore(
    inner,
    cache.newTtlCache<TieredDeflectionSlot>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered deflection slots. Empty fields match all. */
export class TieredDeflectionSlotQuery {
  label: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCost: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredDeflectionSlot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredDeflectionSlot[]): TieredDeflectionSlot[] {
    const matched = collections.filter(items, (candidate: TieredDeflectionSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredDeflectionSlots(store: TieredDeflectionSlotStore, query: TieredDeflectionSlotQuery): TieredDeflectionSlot[] {
  return query.apply(store.list());
}
