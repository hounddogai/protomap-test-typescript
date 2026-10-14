import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StepSlot } from "./step-slot.js";

/** Keeps step slots by code. */
export interface StepSlotStore {
  find(code: string): StepSlot | undefined;
  save(item: StepSlot): void;
  remove(code: string): boolean;
  list(): StepSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStepSlotStore implements StepSlotStore {
  items: Map<string, StepSlot>;
  order: string[];

  constructor(items: Map<string, StepSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StepSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StepSlot): void {
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

  list(): StepSlot[] {
    const out: StepSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStepSlotStore(): StepSlotStore {
  return new MemoryStepSlotStore(new Map<string, StepSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStepSlotStore implements StepSlotStore {
  inner: StepSlotStore;
  cache: cache.TtlCache<StepSlot>;
  hits: number;
  misses: number;

  constructor(inner: StepSlotStore, cacheValue: cache.TtlCache<StepSlot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StepSlot | undefined {
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

  save(item: StepSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StepSlot[] {
    return this.inner.list();
  }
}

export function newCachedStepSlotStore(inner: StepSlotStore, ttl: number, clockValue: clock.Clock): StepSlotStore {
  return new CachedStepSlotStore(inner, cache.newTtlCache<StepSlot>(1024, ttl, clockValue), 0, 0);
}

/** Selects step slots. Empty fields match all. */
export class StepSlotQuery {
  region: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minBid: number, statuses: string[], limit: number) {
    this.region = region;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StepSlot): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StepSlot[]): StepSlot[] {
    const matched = collections.filter(items, (candidate: StepSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStepSlots(store: StepSlotStore, query: StepSlotQuery): StepSlot[] {
  return query.apply(store.list());
}
