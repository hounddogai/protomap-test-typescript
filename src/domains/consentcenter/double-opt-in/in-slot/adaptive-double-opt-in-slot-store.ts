import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveDoubleOptInSlot } from "./adaptive-double-opt-in-slot.js";

/** Keeps adaptive double opt in slots by code. */
export interface AdaptiveDoubleOptInSlotStore {
  find(code: string): AdaptiveDoubleOptInSlot | undefined;
  save(item: AdaptiveDoubleOptInSlot): void;
  remove(code: string): boolean;
  list(): AdaptiveDoubleOptInSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveDoubleOptInSlotStore implements AdaptiveDoubleOptInSlotStore {
  items: Map<string, AdaptiveDoubleOptInSlot>;
  order: string[];

  constructor(items: Map<string, AdaptiveDoubleOptInSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveDoubleOptInSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveDoubleOptInSlot): void {
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

  list(): AdaptiveDoubleOptInSlot[] {
    const out: AdaptiveDoubleOptInSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveDoubleOptInSlotStore(): AdaptiveDoubleOptInSlotStore {
  return new MemoryAdaptiveDoubleOptInSlotStore(new Map<string, AdaptiveDoubleOptInSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveDoubleOptInSlotStore implements AdaptiveDoubleOptInSlotStore {
  inner: AdaptiveDoubleOptInSlotStore;
  cache: cache.TtlCache<AdaptiveDoubleOptInSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveDoubleOptInSlotStore,
    cacheValue: cache.TtlCache<AdaptiveDoubleOptInSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveDoubleOptInSlot | undefined {
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

  save(item: AdaptiveDoubleOptInSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveDoubleOptInSlot[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveDoubleOptInSlotStore(inner: AdaptiveDoubleOptInSlotStore, ttl: number, clockValue: clock.Clock): AdaptiveDoubleOptInSlotStore {
  return new CachedAdaptiveDoubleOptInSlotStore(
    inner,
    cache.newTtlCache<AdaptiveDoubleOptInSlot>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive double opt in slots. Empty fields match all. */
export class AdaptiveDoubleOptInSlotQuery {
  label: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveDoubleOptInSlot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveDoubleOptInSlot[]): AdaptiveDoubleOptInSlot[] {
    const matched = collections.filter(items, (candidate: AdaptiveDoubleOptInSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveDoubleOptInSlots(store: AdaptiveDoubleOptInSlotStore, query: AdaptiveDoubleOptInSlotQuery): AdaptiveDoubleOptInSlot[] {
  return query.apply(store.list());
}
