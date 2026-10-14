import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingJourneySlot } from "./rolling-journey-slot.js";

/** Keeps rolling journey slots by code. */
export interface RollingJourneySlotStore {
  find(code: string): RollingJourneySlot | undefined;
  save(item: RollingJourneySlot): void;
  remove(code: string): boolean;
  list(): RollingJourneySlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingJourneySlotStore implements RollingJourneySlotStore {
  items: Map<string, RollingJourneySlot>;
  order: string[];

  constructor(items: Map<string, RollingJourneySlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingJourneySlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingJourneySlot): void {
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

  list(): RollingJourneySlot[] {
    const out: RollingJourneySlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingJourneySlotStore(): RollingJourneySlotStore {
  return new MemoryRollingJourneySlotStore(new Map<string, RollingJourneySlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingJourneySlotStore implements RollingJourneySlotStore {
  inner: RollingJourneySlotStore;
  cache: cache.TtlCache<RollingJourneySlot>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingJourneySlotStore,
    cacheValue: cache.TtlCache<RollingJourneySlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingJourneySlot | undefined {
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

  save(item: RollingJourneySlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingJourneySlot[] {
    return this.inner.list();
  }
}

export function newCachedRollingJourneySlotStore(inner: RollingJourneySlotStore, ttl: number, clockValue: clock.Clock): RollingJourneySlotStore {
  return new CachedRollingJourneySlotStore(inner, cache.newTtlCache<RollingJourneySlot>(1024, ttl, clockValue), 0, 0);
}

/** Selects rolling journey slots. Empty fields match all. */
export class RollingJourneySlotQuery {
  label: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCost: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingJourneySlot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingJourneySlot[]): RollingJourneySlot[] {
    const matched = collections.filter(items, (candidate: RollingJourneySlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingJourneySlots(store: RollingJourneySlotStore, query: RollingJourneySlotQuery): RollingJourneySlot[] {
  return query.apply(store.list());
}
