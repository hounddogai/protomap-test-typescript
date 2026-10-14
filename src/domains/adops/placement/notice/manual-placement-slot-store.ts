import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualPlacementSlot } from "./manual-placement-slot.js";

/** Keeps manual placement slots by code. */
export interface ManualPlacementSlotStore {
  find(code: string): ManualPlacementSlot | undefined;
  save(item: ManualPlacementSlot): void;
  remove(code: string): boolean;
  list(): ManualPlacementSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualPlacementSlotStore implements ManualPlacementSlotStore {
  items: Map<string, ManualPlacementSlot>;
  order: string[];

  constructor(items: Map<string, ManualPlacementSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualPlacementSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualPlacementSlot): void {
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

  list(): ManualPlacementSlot[] {
    const out: ManualPlacementSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualPlacementSlotStore(): ManualPlacementSlotStore {
  return new MemoryManualPlacementSlotStore(new Map<string, ManualPlacementSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualPlacementSlotStore implements ManualPlacementSlotStore {
  inner: ManualPlacementSlotStore;
  cache: cache.TtlCache<ManualPlacementSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualPlacementSlotStore,
    cacheValue: cache.TtlCache<ManualPlacementSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualPlacementSlot | undefined {
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

  save(item: ManualPlacementSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualPlacementSlot[] {
    return this.inner.list();
  }
}

export function newCachedManualPlacementSlotStore(inner: ManualPlacementSlotStore, ttl: number, clockValue: clock.Clock): ManualPlacementSlotStore {
  return new CachedManualPlacementSlotStore(inner, cache.newTtlCache<ManualPlacementSlot>(64, ttl, clockValue), 0, 0);
}

/** Selects manual placement slots. Empty fields match all. */
export class ManualPlacementSlotQuery {
  locale: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minOpenRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualPlacementSlot): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualPlacementSlot[]): ManualPlacementSlot[] {
    const matched = collections.filter(items, (candidate: ManualPlacementSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualPlacementSlots(store: ManualPlacementSlotStore, query: ManualPlacementSlotQuery): ManualPlacementSlot[] {
  return query.apply(store.list());
}
