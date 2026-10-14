import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalDoubleOptInSlot } from "./seasonal-double-opt-in-slot.js";

/** Keeps seasonal double opt in slots by code. */
export interface SeasonalDoubleOptInSlotStore {
  find(code: string): SeasonalDoubleOptInSlot | undefined;
  save(item: SeasonalDoubleOptInSlot): void;
  remove(code: string): boolean;
  list(): SeasonalDoubleOptInSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalDoubleOptInSlotStore implements SeasonalDoubleOptInSlotStore {
  items: Map<string, SeasonalDoubleOptInSlot>;
  order: string[];

  constructor(items: Map<string, SeasonalDoubleOptInSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalDoubleOptInSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalDoubleOptInSlot): void {
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

  list(): SeasonalDoubleOptInSlot[] {
    const out: SeasonalDoubleOptInSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalDoubleOptInSlotStore(): SeasonalDoubleOptInSlotStore {
  return new MemorySeasonalDoubleOptInSlotStore(new Map<string, SeasonalDoubleOptInSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalDoubleOptInSlotStore implements SeasonalDoubleOptInSlotStore {
  inner: SeasonalDoubleOptInSlotStore;
  cache: cache.TtlCache<SeasonalDoubleOptInSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalDoubleOptInSlotStore,
    cacheValue: cache.TtlCache<SeasonalDoubleOptInSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalDoubleOptInSlot | undefined {
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

  save(item: SeasonalDoubleOptInSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalDoubleOptInSlot[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalDoubleOptInSlotStore(inner: SeasonalDoubleOptInSlotStore, ttl: number, clockValue: clock.Clock): SeasonalDoubleOptInSlotStore {
  return new CachedSeasonalDoubleOptInSlotStore(
    inner,
    cache.newTtlCache<SeasonalDoubleOptInSlot>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal double opt in slots. Empty fields match all. */
export class SeasonalDoubleOptInSlotQuery {
  name: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minEndsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalDoubleOptInSlot): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalDoubleOptInSlot[]): SeasonalDoubleOptInSlot[] {
    const matched = collections.filter(items, (candidate: SeasonalDoubleOptInSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalDoubleOptInSlots(store: SeasonalDoubleOptInSlotStore, query: SeasonalDoubleOptInSlotQuery): SeasonalDoubleOptInSlot[] {
  return query.apply(store.list());
}
