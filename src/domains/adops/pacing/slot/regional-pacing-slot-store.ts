import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalPacingSlot } from "./regional-pacing-slot.js";

/** Keeps regional pacing slots by code. */
export interface RegionalPacingSlotStore {
  find(code: string): RegionalPacingSlot | undefined;
  save(item: RegionalPacingSlot): void;
  remove(code: string): boolean;
  list(): RegionalPacingSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalPacingSlotStore implements RegionalPacingSlotStore {
  items: Map<string, RegionalPacingSlot>;
  order: string[];

  constructor(items: Map<string, RegionalPacingSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalPacingSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalPacingSlot): void {
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

  list(): RegionalPacingSlot[] {
    const out: RegionalPacingSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalPacingSlotStore(): RegionalPacingSlotStore {
  return new MemoryRegionalPacingSlotStore(new Map<string, RegionalPacingSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalPacingSlotStore implements RegionalPacingSlotStore {
  inner: RegionalPacingSlotStore;
  cache: cache.TtlCache<RegionalPacingSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalPacingSlotStore,
    cacheValue: cache.TtlCache<RegionalPacingSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalPacingSlot | undefined {
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

  save(item: RegionalPacingSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalPacingSlot[] {
    return this.inner.list();
  }
}

export function newCachedRegionalPacingSlotStore(inner: RegionalPacingSlotStore, ttl: number, clockValue: clock.Clock): RegionalPacingSlotStore {
  return new CachedRegionalPacingSlotStore(inner, cache.newTtlCache<RegionalPacingSlot>(1024, ttl, clockValue), 0, 0);
}

/** Selects regional pacing slots. Empty fields match all. */
export class RegionalPacingSlotQuery {
  label: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMargin: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalPacingSlot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalPacingSlot[]): RegionalPacingSlot[] {
    const matched = collections.filter(items, (candidate: RegionalPacingSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalPacingSlots(store: RegionalPacingSlotStore, query: RegionalPacingSlotQuery): RegionalPacingSlot[] {
  return query.apply(store.list());
}
