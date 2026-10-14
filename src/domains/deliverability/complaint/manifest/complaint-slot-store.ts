import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ComplaintSlot } from "./complaint-slot.js";

/** Keeps complaint slots by code. */
export interface ComplaintSlotStore {
  find(code: string): ComplaintSlot | undefined;
  save(item: ComplaintSlot): void;
  remove(code: string): boolean;
  list(): ComplaintSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryComplaintSlotStore implements ComplaintSlotStore {
  items: Map<string, ComplaintSlot>;
  order: string[];

  constructor(items: Map<string, ComplaintSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ComplaintSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ComplaintSlot): void {
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

  list(): ComplaintSlot[] {
    const out: ComplaintSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryComplaintSlotStore(): ComplaintSlotStore {
  return new MemoryComplaintSlotStore(new Map<string, ComplaintSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedComplaintSlotStore implements ComplaintSlotStore {
  inner: ComplaintSlotStore;
  cache: cache.TtlCache<ComplaintSlot>;
  hits: number;
  misses: number;

  constructor(inner: ComplaintSlotStore, cacheValue: cache.TtlCache<ComplaintSlot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ComplaintSlot | undefined {
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

  save(item: ComplaintSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ComplaintSlot[] {
    return this.inner.list();
  }
}

export function newCachedComplaintSlotStore(inner: ComplaintSlotStore, ttl: number, clockValue: clock.Clock): ComplaintSlotStore {
  return new CachedComplaintSlotStore(inner, cache.newTtlCache<ComplaintSlot>(64, ttl, clockValue), 0, 0);
}

/** Selects complaint slots. Empty fields match all. */
export class ComplaintSlotQuery {
  locale: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMargin: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ComplaintSlot): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ComplaintSlot[]): ComplaintSlot[] {
    const matched = collections.filter(items, (candidate: ComplaintSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findComplaintSlots(store: ComplaintSlotStore, query: ComplaintSlotQuery): ComplaintSlot[] {
  return query.apply(store.list());
}
