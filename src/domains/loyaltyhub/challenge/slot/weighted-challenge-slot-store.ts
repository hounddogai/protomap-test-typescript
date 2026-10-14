import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedChallengeSlot } from "./weighted-challenge-slot.js";

/** Keeps weighted challenge slots by code. */
export interface WeightedChallengeSlotStore {
  find(code: string): WeightedChallengeSlot | undefined;
  save(item: WeightedChallengeSlot): void;
  remove(code: string): boolean;
  list(): WeightedChallengeSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedChallengeSlotStore implements WeightedChallengeSlotStore {
  items: Map<string, WeightedChallengeSlot>;
  order: string[];

  constructor(items: Map<string, WeightedChallengeSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedChallengeSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedChallengeSlot): void {
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

  list(): WeightedChallengeSlot[] {
    const out: WeightedChallengeSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedChallengeSlotStore(): WeightedChallengeSlotStore {
  return new MemoryWeightedChallengeSlotStore(new Map<string, WeightedChallengeSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedChallengeSlotStore implements WeightedChallengeSlotStore {
  inner: WeightedChallengeSlotStore;
  cache: cache.TtlCache<WeightedChallengeSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedChallengeSlotStore,
    cacheValue: cache.TtlCache<WeightedChallengeSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedChallengeSlot | undefined {
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

  save(item: WeightedChallengeSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedChallengeSlot[] {
    return this.inner.list();
  }
}

export function newCachedWeightedChallengeSlotStore(inner: WeightedChallengeSlotStore, ttl: number, clockValue: clock.Clock): WeightedChallengeSlotStore {
  return new CachedWeightedChallengeSlotStore(
    inner,
    cache.newTtlCache<WeightedChallengeSlot>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted challenge slots. Empty fields match all. */
export class WeightedChallengeSlotQuery {
  label: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFloorValue: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedChallengeSlot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedChallengeSlot[]): WeightedChallengeSlot[] {
    const matched = collections.filter(items, (candidate: WeightedChallengeSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedChallengeSlots(store: WeightedChallengeSlotStore, query: WeightedChallengeSlotQuery): WeightedChallengeSlot[] {
  return query.apply(store.list());
}
