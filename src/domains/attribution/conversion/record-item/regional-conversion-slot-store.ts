import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalConversionSlot } from "./regional-conversion-slot.js";

/** Keeps regional conversion slots by code. */
export interface RegionalConversionSlotStore {
  find(code: string): RegionalConversionSlot | undefined;
  save(item: RegionalConversionSlot): void;
  remove(code: string): boolean;
  list(): RegionalConversionSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalConversionSlotStore implements RegionalConversionSlotStore {
  items: Map<string, RegionalConversionSlot>;
  order: string[];

  constructor(items: Map<string, RegionalConversionSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalConversionSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalConversionSlot): void {
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

  list(): RegionalConversionSlot[] {
    const out: RegionalConversionSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalConversionSlotStore(): RegionalConversionSlotStore {
  return new MemoryRegionalConversionSlotStore(new Map<string, RegionalConversionSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalConversionSlotStore implements RegionalConversionSlotStore {
  inner: RegionalConversionSlotStore;
  cache: cache.TtlCache<RegionalConversionSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalConversionSlotStore,
    cacheValue: cache.TtlCache<RegionalConversionSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalConversionSlot | undefined {
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

  save(item: RegionalConversionSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalConversionSlot[] {
    return this.inner.list();
  }
}

export function newCachedRegionalConversionSlotStore(inner: RegionalConversionSlotStore, ttl: number, clockValue: clock.Clock): RegionalConversionSlotStore {
  return new CachedRegionalConversionSlotStore(
    inner,
    cache.newTtlCache<RegionalConversionSlot>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional conversion slots. Empty fields match all. */
export class RegionalConversionSlotQuery {
  title: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMinimum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalConversionSlot): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalConversionSlot[]): RegionalConversionSlot[] {
    const matched = collections.filter(items, (candidate: RegionalConversionSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalConversionSlots(store: RegionalConversionSlotStore, query: RegionalConversionSlotQuery): RegionalConversionSlot[] {
  return query.apply(store.list());
}
