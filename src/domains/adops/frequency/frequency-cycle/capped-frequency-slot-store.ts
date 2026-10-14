import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedFrequencySlot } from "./capped-frequency-slot.js";

/** Keeps capped frequency slots by code. */
export interface CappedFrequencySlotStore {
  find(code: string): CappedFrequencySlot | undefined;
  save(item: CappedFrequencySlot): void;
  remove(code: string): boolean;
  list(): CappedFrequencySlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedFrequencySlotStore implements CappedFrequencySlotStore {
  items: Map<string, CappedFrequencySlot>;
  order: string[];

  constructor(items: Map<string, CappedFrequencySlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedFrequencySlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedFrequencySlot): void {
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

  list(): CappedFrequencySlot[] {
    const out: CappedFrequencySlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedFrequencySlotStore(): CappedFrequencySlotStore {
  return new MemoryCappedFrequencySlotStore(new Map<string, CappedFrequencySlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedFrequencySlotStore implements CappedFrequencySlotStore {
  inner: CappedFrequencySlotStore;
  cache: cache.TtlCache<CappedFrequencySlot>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedFrequencySlotStore,
    cacheValue: cache.TtlCache<CappedFrequencySlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedFrequencySlot | undefined {
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

  save(item: CappedFrequencySlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedFrequencySlot[] {
    return this.inner.list();
  }
}

export function newCachedCappedFrequencySlotStore(inner: CappedFrequencySlotStore, ttl: number, clockValue: clock.Clock): CappedFrequencySlotStore {
  return new CachedCappedFrequencySlotStore(inner, cache.newTtlCache<CappedFrequencySlot>(1024, ttl, clockValue), 0, 0);
}

/** Selects capped frequency slots. Empty fields match all. */
export class CappedFrequencySlotQuery {
  channel: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minWeight: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedFrequencySlot): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedFrequencySlot[]): CappedFrequencySlot[] {
    const matched = collections.filter(items, (candidate: CappedFrequencySlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedFrequencySlots(store: CappedFrequencySlotStore, query: CappedFrequencySlotQuery): CappedFrequencySlot[] {
  return query.apply(store.list());
}
