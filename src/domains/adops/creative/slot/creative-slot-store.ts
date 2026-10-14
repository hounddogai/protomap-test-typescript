import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeSlot } from "./creative-slot.js";

/** Keeps creative slots by code. */
export interface CreativeSlotStore {
  find(code: string): CreativeSlot | undefined;
  save(item: CreativeSlot): void;
  remove(code: string): boolean;
  list(): CreativeSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeSlotStore implements CreativeSlotStore {
  items: Map<string, CreativeSlot>;
  order: string[];

  constructor(items: Map<string, CreativeSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeSlot): void {
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

  list(): CreativeSlot[] {
    const out: CreativeSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeSlotStore(): CreativeSlotStore {
  return new MemoryCreativeSlotStore(new Map<string, CreativeSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeSlotStore implements CreativeSlotStore {
  inner: CreativeSlotStore;
  cache: cache.TtlCache<CreativeSlot>;
  hits: number;
  misses: number;

  constructor(inner: CreativeSlotStore, cacheValue: cache.TtlCache<CreativeSlot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeSlot | undefined {
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

  save(item: CreativeSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeSlot[] {
    return this.inner.list();
  }
}

export function newCachedCreativeSlotStore(inner: CreativeSlotStore, ttl: number, clockValue: clock.Clock): CreativeSlotStore {
  return new CachedCreativeSlotStore(inner, cache.newTtlCache<CreativeSlot>(256, ttl, clockValue), 0, 0);
}

/** Selects creative slots. Empty fields match all. */
export class CreativeSlotQuery {
  region: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minMaximum: number, statuses: string[], limit: number) {
    this.region = region;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeSlot): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeSlot[]): CreativeSlot[] {
    const matched = collections.filter(items, (candidate: CreativeSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeSlots(store: CreativeSlotStore, query: CreativeSlotQuery): CreativeSlot[] {
  return query.apply(store.list());
}
