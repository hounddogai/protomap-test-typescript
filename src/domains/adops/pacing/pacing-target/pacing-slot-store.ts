import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingSlot } from "./pacing-slot.js";

/** Keeps pacing slots by code. */
export interface PacingSlotStore {
  find(code: string): PacingSlot | undefined;
  save(item: PacingSlot): void;
  remove(code: string): boolean;
  list(): PacingSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingSlotStore implements PacingSlotStore {
  items: Map<string, PacingSlot>;
  order: string[];

  constructor(items: Map<string, PacingSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingSlot): void {
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

  list(): PacingSlot[] {
    const out: PacingSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingSlotStore(): PacingSlotStore {
  return new MemoryPacingSlotStore(new Map<string, PacingSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingSlotStore implements PacingSlotStore {
  inner: PacingSlotStore;
  cache: cache.TtlCache<PacingSlot>;
  hits: number;
  misses: number;

  constructor(inner: PacingSlotStore, cacheValue: cache.TtlCache<PacingSlot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingSlot | undefined {
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

  save(item: PacingSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingSlot[] {
    return this.inner.list();
  }
}

export function newCachedPacingSlotStore(inner: PacingSlotStore, ttl: number, clockValue: clock.Clock): PacingSlotStore {
  return new CachedPacingSlotStore(inner, cache.newTtlCache<PacingSlot>(512, ttl, clockValue), 0, 0);
}

/** Selects pacing slots. Empty fields match all. */
export class PacingSlotQuery {
  label: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minConversionRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingSlot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingSlot[]): PacingSlot[] {
    const matched = collections.filter(items, (candidate: PacingSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingSlots(store: PacingSlotStore, query: PacingSlotQuery): PacingSlot[] {
  return query.apply(store.list());
}
