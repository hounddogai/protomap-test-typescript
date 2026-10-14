import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalBadgeSlot } from "./seasonal-badge-slot.js";

/** Keeps seasonal badge slots by code. */
export interface SeasonalBadgeSlotStore {
  find(code: string): SeasonalBadgeSlot | undefined;
  save(item: SeasonalBadgeSlot): void;
  remove(code: string): boolean;
  list(): SeasonalBadgeSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalBadgeSlotStore implements SeasonalBadgeSlotStore {
  items: Map<string, SeasonalBadgeSlot>;
  order: string[];

  constructor(items: Map<string, SeasonalBadgeSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalBadgeSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalBadgeSlot): void {
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

  list(): SeasonalBadgeSlot[] {
    const out: SeasonalBadgeSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalBadgeSlotStore(): SeasonalBadgeSlotStore {
  return new MemorySeasonalBadgeSlotStore(new Map<string, SeasonalBadgeSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalBadgeSlotStore implements SeasonalBadgeSlotStore {
  inner: SeasonalBadgeSlotStore;
  cache: cache.TtlCache<SeasonalBadgeSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalBadgeSlotStore,
    cacheValue: cache.TtlCache<SeasonalBadgeSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalBadgeSlot | undefined {
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

  save(item: SeasonalBadgeSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalBadgeSlot[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalBadgeSlotStore(inner: SeasonalBadgeSlotStore, ttl: number, clockValue: clock.Clock): SeasonalBadgeSlotStore {
  return new CachedSeasonalBadgeSlotStore(inner, cache.newTtlCache<SeasonalBadgeSlot>(1024, ttl, clockValue), 0, 0);
}

/** Selects seasonal badge slots. Empty fields match all. */
export class SeasonalBadgeSlotQuery {
  name: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDiscount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalBadgeSlot): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalBadgeSlot[]): SeasonalBadgeSlot[] {
    const matched = collections.filter(items, (candidate: SeasonalBadgeSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalBadgeSlots(store: SeasonalBadgeSlotStore, query: SeasonalBadgeSlotQuery): SeasonalBadgeSlot[] {
  return query.apply(store.list());
}
