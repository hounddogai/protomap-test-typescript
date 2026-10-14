import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalConversionSlot } from "./seasonal-conversion-slot.js";

/** Keeps seasonal conversion slots by code. */
export interface SeasonalConversionSlotStore {
  find(code: string): SeasonalConversionSlot | undefined;
  save(item: SeasonalConversionSlot): void;
  remove(code: string): boolean;
  list(): SeasonalConversionSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalConversionSlotStore implements SeasonalConversionSlotStore {
  items: Map<string, SeasonalConversionSlot>;
  order: string[];

  constructor(items: Map<string, SeasonalConversionSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalConversionSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalConversionSlot): void {
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

  list(): SeasonalConversionSlot[] {
    const out: SeasonalConversionSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalConversionSlotStore(): SeasonalConversionSlotStore {
  return new MemorySeasonalConversionSlotStore(new Map<string, SeasonalConversionSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalConversionSlotStore implements SeasonalConversionSlotStore {
  inner: SeasonalConversionSlotStore;
  cache: cache.TtlCache<SeasonalConversionSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalConversionSlotStore,
    cacheValue: cache.TtlCache<SeasonalConversionSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalConversionSlot | undefined {
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

  save(item: SeasonalConversionSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalConversionSlot[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalConversionSlotStore(inner: SeasonalConversionSlotStore, ttl: number, clockValue: clock.Clock): SeasonalConversionSlotStore {
  return new CachedSeasonalConversionSlotStore(
    inner,
    cache.newTtlCache<SeasonalConversionSlot>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal conversion slots. Empty fields match all. */
export class SeasonalConversionSlotQuery {
  segment: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minCost: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalConversionSlot): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalConversionSlot[]): SeasonalConversionSlot[] {
    const matched = collections.filter(items, (candidate: SeasonalConversionSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalConversionSlots(store: SeasonalConversionSlotStore, query: SeasonalConversionSlotQuery): SeasonalConversionSlot[] {
  return query.apply(store.list());
}
