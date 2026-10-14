import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalProofSlot } from "./global-proof-slot.js";

/** Keeps global proof slots by code. */
export interface GlobalProofSlotStore {
  find(code: string): GlobalProofSlot | undefined;
  save(item: GlobalProofSlot): void;
  remove(code: string): boolean;
  list(): GlobalProofSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalProofSlotStore implements GlobalProofSlotStore {
  items: Map<string, GlobalProofSlot>;
  order: string[];

  constructor(items: Map<string, GlobalProofSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalProofSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalProofSlot): void {
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

  list(): GlobalProofSlot[] {
    const out: GlobalProofSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalProofSlotStore(): GlobalProofSlotStore {
  return new MemoryGlobalProofSlotStore(new Map<string, GlobalProofSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalProofSlotStore implements GlobalProofSlotStore {
  inner: GlobalProofSlotStore;
  cache: cache.TtlCache<GlobalProofSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalProofSlotStore,
    cacheValue: cache.TtlCache<GlobalProofSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalProofSlot | undefined {
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

  save(item: GlobalProofSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalProofSlot[] {
    return this.inner.list();
  }
}

export function newCachedGlobalProofSlotStore(inner: GlobalProofSlotStore, ttl: number, clockValue: clock.Clock): GlobalProofSlotStore {
  return new CachedGlobalProofSlotStore(inner, cache.newTtlCache<GlobalProofSlot>(128, ttl, clockValue), 0, 0);
}

/** Selects global proof slots. Empty fields match all. */
export class GlobalProofSlotQuery {
  country: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minCeiling: number, statuses: string[], limit: number) {
    this.country = country;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalProofSlot): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalProofSlot[]): GlobalProofSlot[] {
    const matched = collections.filter(items, (candidate: GlobalProofSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalProofSlots(store: GlobalProofSlotStore, query: GlobalProofSlotQuery): GlobalProofSlot[] {
  return query.apply(store.list());
}
