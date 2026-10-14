import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionSlot } from "./conversion-slot.js";

/** Keeps conversion slots by code. */
export interface ConversionSlotStore {
  find(code: string): ConversionSlot | undefined;
  save(item: ConversionSlot): void;
  remove(code: string): boolean;
  list(): ConversionSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionSlotStore implements ConversionSlotStore {
  items: Map<string, ConversionSlot>;
  order: string[];

  constructor(items: Map<string, ConversionSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionSlot): void {
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

  list(): ConversionSlot[] {
    const out: ConversionSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionSlotStore(): ConversionSlotStore {
  return new MemoryConversionSlotStore(new Map<string, ConversionSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionSlotStore implements ConversionSlotStore {
  inner: ConversionSlotStore;
  cache: cache.TtlCache<ConversionSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionSlotStore,
    cacheValue: cache.TtlCache<ConversionSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionSlot | undefined {
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

  save(item: ConversionSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionSlot[] {
    return this.inner.list();
  }
}

export function newCachedConversionSlotStore(inner: ConversionSlotStore, ttl: number, clockValue: clock.Clock): ConversionSlotStore {
  return new CachedConversionSlotStore(inner, cache.newTtlCache<ConversionSlot>(256, ttl, clockValue), 0, 0);
}

/** Selects conversion slots. Empty fields match all. */
export class ConversionSlotQuery {
  channel: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionSlot): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionSlot[]): ConversionSlot[] {
    const matched = collections.filter(items, (candidate: ConversionSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionSlots(store: ConversionSlotStore, query: ConversionSlotQuery): ConversionSlot[] {
  return query.apply(store.list());
}
