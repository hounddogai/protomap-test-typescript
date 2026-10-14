import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionSlot } from "./deflection-slot.js";

/** Keeps deflection slots by code. */
export interface DeflectionSlotStore {
  find(code: string): DeflectionSlot | undefined;
  save(item: DeflectionSlot): void;
  remove(code: string): boolean;
  list(): DeflectionSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionSlotStore implements DeflectionSlotStore {
  items: Map<string, DeflectionSlot>;
  order: string[];

  constructor(items: Map<string, DeflectionSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionSlot): void {
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

  list(): DeflectionSlot[] {
    const out: DeflectionSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionSlotStore(): DeflectionSlotStore {
  return new MemoryDeflectionSlotStore(new Map<string, DeflectionSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionSlotStore implements DeflectionSlotStore {
  inner: DeflectionSlotStore;
  cache: cache.TtlCache<DeflectionSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionSlotStore,
    cacheValue: cache.TtlCache<DeflectionSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionSlot | undefined {
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

  save(item: DeflectionSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionSlot[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionSlotStore(inner: DeflectionSlotStore, ttl: number, clockValue: clock.Clock): DeflectionSlotStore {
  return new CachedDeflectionSlotStore(inner, cache.newTtlCache<DeflectionSlot>(1024, ttl, clockValue), 0, 0);
}

/** Selects deflection slots. Empty fields match all. */
export class DeflectionSlotQuery {
  region: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minRevision: number, statuses: string[], limit: number) {
    this.region = region;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionSlot): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionSlot[]): DeflectionSlot[] {
    const matched = collections.filter(items, (candidate: DeflectionSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionSlots(store: DeflectionSlotStore, query: DeflectionSlotQuery): DeflectionSlot[] {
  return query.apply(store.list());
}
