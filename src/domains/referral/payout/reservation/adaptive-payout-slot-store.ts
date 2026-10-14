import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptivePayoutSlot } from "./adaptive-payout-slot.js";

/** Keeps adaptive payout slots by code. */
export interface AdaptivePayoutSlotStore {
  find(code: string): AdaptivePayoutSlot | undefined;
  save(item: AdaptivePayoutSlot): void;
  remove(code: string): boolean;
  list(): AdaptivePayoutSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptivePayoutSlotStore implements AdaptivePayoutSlotStore {
  items: Map<string, AdaptivePayoutSlot>;
  order: string[];

  constructor(items: Map<string, AdaptivePayoutSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptivePayoutSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptivePayoutSlot): void {
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

  list(): AdaptivePayoutSlot[] {
    const out: AdaptivePayoutSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptivePayoutSlotStore(): AdaptivePayoutSlotStore {
  return new MemoryAdaptivePayoutSlotStore(new Map<string, AdaptivePayoutSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptivePayoutSlotStore implements AdaptivePayoutSlotStore {
  inner: AdaptivePayoutSlotStore;
  cache: cache.TtlCache<AdaptivePayoutSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptivePayoutSlotStore,
    cacheValue: cache.TtlCache<AdaptivePayoutSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptivePayoutSlot | undefined {
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

  save(item: AdaptivePayoutSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptivePayoutSlot[] {
    return this.inner.list();
  }
}

export function newCachedAdaptivePayoutSlotStore(inner: AdaptivePayoutSlotStore, ttl: number, clockValue: clock.Clock): AdaptivePayoutSlotStore {
  return new CachedAdaptivePayoutSlotStore(inner, cache.newTtlCache<AdaptivePayoutSlot>(256, ttl, clockValue), 0, 0);
}

/** Selects adaptive payout slots. Empty fields match all. */
export class AdaptivePayoutSlotQuery {
  title: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMinimum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptivePayoutSlot): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptivePayoutSlot[]): AdaptivePayoutSlot[] {
    const matched = collections.filter(items, (candidate: AdaptivePayoutSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptivePayoutSlots(store: AdaptivePayoutSlotStore, query: AdaptivePayoutSlotQuery): AdaptivePayoutSlot[] {
  return query.apply(store.list());
}
