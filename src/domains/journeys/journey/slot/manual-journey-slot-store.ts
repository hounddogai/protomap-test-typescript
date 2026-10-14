import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualJourneySlot } from "./manual-journey-slot.js";

/** Keeps manual journey slots by code. */
export interface ManualJourneySlotStore {
  find(code: string): ManualJourneySlot | undefined;
  save(item: ManualJourneySlot): void;
  remove(code: string): boolean;
  list(): ManualJourneySlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualJourneySlotStore implements ManualJourneySlotStore {
  items: Map<string, ManualJourneySlot>;
  order: string[];

  constructor(items: Map<string, ManualJourneySlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualJourneySlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualJourneySlot): void {
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

  list(): ManualJourneySlot[] {
    const out: ManualJourneySlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualJourneySlotStore(): ManualJourneySlotStore {
  return new MemoryManualJourneySlotStore(new Map<string, ManualJourneySlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualJourneySlotStore implements ManualJourneySlotStore {
  inner: ManualJourneySlotStore;
  cache: cache.TtlCache<ManualJourneySlot>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualJourneySlotStore,
    cacheValue: cache.TtlCache<ManualJourneySlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualJourneySlot | undefined {
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

  save(item: ManualJourneySlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualJourneySlot[] {
    return this.inner.list();
  }
}

export function newCachedManualJourneySlotStore(inner: ManualJourneySlotStore, ttl: number, clockValue: clock.Clock): ManualJourneySlotStore {
  return new CachedManualJourneySlotStore(inner, cache.newTtlCache<ManualJourneySlot>(128, ttl, clockValue), 0, 0);
}

/** Selects manual journey slots. Empty fields match all. */
export class ManualJourneySlotQuery {
  channel: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRetries: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualJourneySlot): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualJourneySlot[]): ManualJourneySlot[] {
    const matched = collections.filter(items, (candidate: ManualJourneySlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualJourneySlots(store: ManualJourneySlotStore, query: ManualJourneySlotQuery): ManualJourneySlot[] {
  return query.apply(store.list());
}
