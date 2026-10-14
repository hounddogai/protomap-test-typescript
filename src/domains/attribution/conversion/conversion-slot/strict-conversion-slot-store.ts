import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictConversionSlot } from "./strict-conversion-slot.js";

/** Keeps strict conversion slots by code. */
export interface StrictConversionSlotStore {
  find(code: string): StrictConversionSlot | undefined;
  save(item: StrictConversionSlot): void;
  remove(code: string): boolean;
  list(): StrictConversionSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictConversionSlotStore implements StrictConversionSlotStore {
  items: Map<string, StrictConversionSlot>;
  order: string[];

  constructor(items: Map<string, StrictConversionSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictConversionSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictConversionSlot): void {
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

  list(): StrictConversionSlot[] {
    const out: StrictConversionSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictConversionSlotStore(): StrictConversionSlotStore {
  return new MemoryStrictConversionSlotStore(new Map<string, StrictConversionSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictConversionSlotStore implements StrictConversionSlotStore {
  inner: StrictConversionSlotStore;
  cache: cache.TtlCache<StrictConversionSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictConversionSlotStore,
    cacheValue: cache.TtlCache<StrictConversionSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictConversionSlot | undefined {
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

  save(item: StrictConversionSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictConversionSlot[] {
    return this.inner.list();
  }
}

export function newCachedStrictConversionSlotStore(inner: StrictConversionSlotStore, ttl: number, clockValue: clock.Clock): StrictConversionSlotStore {
  return new CachedStrictConversionSlotStore(
    inner,
    cache.newTtlCache<StrictConversionSlot>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict conversion slots. Empty fields match all. */
export class StrictConversionSlotQuery {
  title: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minThreshold: number, statuses: string[], limit: number) {
    this.title = title;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictConversionSlot): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictConversionSlot[]): StrictConversionSlot[] {
    const matched = collections.filter(items, (candidate: StrictConversionSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictConversionSlots(store: StrictConversionSlotStore, query: StrictConversionSlotQuery): StrictConversionSlot[] {
  return query.apply(store.list());
}
