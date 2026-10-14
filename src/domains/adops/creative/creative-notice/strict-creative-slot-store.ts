import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictCreativeSlot } from "./strict-creative-slot.js";

/** Keeps strict creative slots by code. */
export interface StrictCreativeSlotStore {
  find(code: string): StrictCreativeSlot | undefined;
  save(item: StrictCreativeSlot): void;
  remove(code: string): boolean;
  list(): StrictCreativeSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictCreativeSlotStore implements StrictCreativeSlotStore {
  items: Map<string, StrictCreativeSlot>;
  order: string[];

  constructor(items: Map<string, StrictCreativeSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictCreativeSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictCreativeSlot): void {
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

  list(): StrictCreativeSlot[] {
    const out: StrictCreativeSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictCreativeSlotStore(): StrictCreativeSlotStore {
  return new MemoryStrictCreativeSlotStore(new Map<string, StrictCreativeSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictCreativeSlotStore implements StrictCreativeSlotStore {
  inner: StrictCreativeSlotStore;
  cache: cache.TtlCache<StrictCreativeSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictCreativeSlotStore,
    cacheValue: cache.TtlCache<StrictCreativeSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictCreativeSlot | undefined {
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

  save(item: StrictCreativeSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictCreativeSlot[] {
    return this.inner.list();
  }
}

export function newCachedStrictCreativeSlotStore(inner: StrictCreativeSlotStore, ttl: number, clockValue: clock.Clock): StrictCreativeSlotStore {
  return new CachedStrictCreativeSlotStore(inner, cache.newTtlCache<StrictCreativeSlot>(128, ttl, clockValue), 0, 0);
}

/** Selects strict creative slots. Empty fields match all. */
export class StrictCreativeSlotQuery {
  utmSource: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minClicks: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictCreativeSlot): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictCreativeSlot[]): StrictCreativeSlot[] {
    const matched = collections.filter(items, (candidate: StrictCreativeSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictCreativeSlots(store: StrictCreativeSlotStore, query: StrictCreativeSlotQuery): StrictCreativeSlot[] {
  return query.apply(store.list());
}
