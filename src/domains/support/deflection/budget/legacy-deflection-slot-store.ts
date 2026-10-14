import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyDeflectionSlot } from "./legacy-deflection-slot.js";

/** Keeps legacy deflection slots by code. */
export interface LegacyDeflectionSlotStore {
  find(code: string): LegacyDeflectionSlot | undefined;
  save(item: LegacyDeflectionSlot): void;
  remove(code: string): boolean;
  list(): LegacyDeflectionSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyDeflectionSlotStore implements LegacyDeflectionSlotStore {
  items: Map<string, LegacyDeflectionSlot>;
  order: string[];

  constructor(items: Map<string, LegacyDeflectionSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyDeflectionSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyDeflectionSlot): void {
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

  list(): LegacyDeflectionSlot[] {
    const out: LegacyDeflectionSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyDeflectionSlotStore(): LegacyDeflectionSlotStore {
  return new MemoryLegacyDeflectionSlotStore(new Map<string, LegacyDeflectionSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyDeflectionSlotStore implements LegacyDeflectionSlotStore {
  inner: LegacyDeflectionSlotStore;
  cache: cache.TtlCache<LegacyDeflectionSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyDeflectionSlotStore,
    cacheValue: cache.TtlCache<LegacyDeflectionSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyDeflectionSlot | undefined {
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

  save(item: LegacyDeflectionSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyDeflectionSlot[] {
    return this.inner.list();
  }
}

export function newCachedLegacyDeflectionSlotStore(inner: LegacyDeflectionSlotStore, ttl: number, clockValue: clock.Clock): LegacyDeflectionSlotStore {
  return new CachedLegacyDeflectionSlotStore(
    inner,
    cache.newTtlCache<LegacyDeflectionSlot>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy deflection slots. Empty fields match all. */
export class LegacyDeflectionSlotQuery {
  source: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRate: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyDeflectionSlot): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyDeflectionSlot[]): LegacyDeflectionSlot[] {
    const matched = collections.filter(items, (candidate: LegacyDeflectionSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyDeflectionSlots(store: LegacyDeflectionSlotStore, query: LegacyDeflectionSlotQuery): LegacyDeflectionSlot[] {
  return query.apply(store.list());
}
