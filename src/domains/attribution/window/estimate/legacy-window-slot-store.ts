import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyWindowSlot } from "./legacy-window-slot.js";

/** Keeps legacy window slots by code. */
export interface LegacyWindowSlotStore {
  find(code: string): LegacyWindowSlot | undefined;
  save(item: LegacyWindowSlot): void;
  remove(code: string): boolean;
  list(): LegacyWindowSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyWindowSlotStore implements LegacyWindowSlotStore {
  items: Map<string, LegacyWindowSlot>;
  order: string[];

  constructor(items: Map<string, LegacyWindowSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyWindowSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyWindowSlot): void {
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

  list(): LegacyWindowSlot[] {
    const out: LegacyWindowSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyWindowSlotStore(): LegacyWindowSlotStore {
  return new MemoryLegacyWindowSlotStore(new Map<string, LegacyWindowSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyWindowSlotStore implements LegacyWindowSlotStore {
  inner: LegacyWindowSlotStore;
  cache: cache.TtlCache<LegacyWindowSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyWindowSlotStore,
    cacheValue: cache.TtlCache<LegacyWindowSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyWindowSlot | undefined {
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

  save(item: LegacyWindowSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyWindowSlot[] {
    return this.inner.list();
  }
}

export function newCachedLegacyWindowSlotStore(inner: LegacyWindowSlotStore, ttl: number, clockValue: clock.Clock): LegacyWindowSlotStore {
  return new CachedLegacyWindowSlotStore(inner, cache.newTtlCache<LegacyWindowSlot>(64, ttl, clockValue), 0, 0);
}

/** Selects legacy window slots. Empty fields match all. */
export class LegacyWindowSlotQuery {
  country: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minSequence: number, statuses: string[], limit: number) {
    this.country = country;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyWindowSlot): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyWindowSlot[]): LegacyWindowSlot[] {
    const matched = collections.filter(items, (candidate: LegacyWindowSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyWindowSlots(store: LegacyWindowSlotStore, query: LegacyWindowSlotQuery): LegacyWindowSlot[] {
  return query.apply(store.list());
}
