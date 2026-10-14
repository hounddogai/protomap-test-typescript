import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveFunnelSlot } from "./adaptive-funnel-slot.js";

/** Keeps adaptive funnel slots by code. */
export interface AdaptiveFunnelSlotStore {
  find(code: string): AdaptiveFunnelSlot | undefined;
  save(item: AdaptiveFunnelSlot): void;
  remove(code: string): boolean;
  list(): AdaptiveFunnelSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveFunnelSlotStore implements AdaptiveFunnelSlotStore {
  items: Map<string, AdaptiveFunnelSlot>;
  order: string[];

  constructor(items: Map<string, AdaptiveFunnelSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveFunnelSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveFunnelSlot): void {
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

  list(): AdaptiveFunnelSlot[] {
    const out: AdaptiveFunnelSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveFunnelSlotStore(): AdaptiveFunnelSlotStore {
  return new MemoryAdaptiveFunnelSlotStore(new Map<string, AdaptiveFunnelSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveFunnelSlotStore implements AdaptiveFunnelSlotStore {
  inner: AdaptiveFunnelSlotStore;
  cache: cache.TtlCache<AdaptiveFunnelSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveFunnelSlotStore,
    cacheValue: cache.TtlCache<AdaptiveFunnelSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveFunnelSlot | undefined {
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

  save(item: AdaptiveFunnelSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveFunnelSlot[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveFunnelSlotStore(inner: AdaptiveFunnelSlotStore, ttl: number, clockValue: clock.Clock): AdaptiveFunnelSlotStore {
  return new CachedAdaptiveFunnelSlotStore(inner, cache.newTtlCache<AdaptiveFunnelSlot>(64, ttl, clockValue), 0, 0);
}

/** Selects adaptive funnel slots. Empty fields match all. */
export class AdaptiveFunnelSlotQuery {
  title: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minSequence: number, statuses: string[], limit: number) {
    this.title = title;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveFunnelSlot): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveFunnelSlot[]): AdaptiveFunnelSlot[] {
    const matched = collections.filter(items, (candidate: AdaptiveFunnelSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveFunnelSlots(store: AdaptiveFunnelSlotStore, query: AdaptiveFunnelSlotQuery): AdaptiveFunnelSlot[] {
  return query.apply(store.list());
}
