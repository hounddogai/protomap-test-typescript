import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaSlot } from "./sla-slot.js";

/** Keeps sla slots by code. */
export interface SlaSlotStore {
  find(code: string): SlaSlot | undefined;
  save(item: SlaSlot): void;
  remove(code: string): boolean;
  list(): SlaSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaSlotStore implements SlaSlotStore {
  items: Map<string, SlaSlot>;
  order: string[];

  constructor(items: Map<string, SlaSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaSlot): void {
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

  list(): SlaSlot[] {
    const out: SlaSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaSlotStore(): SlaSlotStore {
  return new MemorySlaSlotStore(new Map<string, SlaSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaSlotStore implements SlaSlotStore {
  inner: SlaSlotStore;
  cache: cache.TtlCache<SlaSlot>;
  hits: number;
  misses: number;

  constructor(inner: SlaSlotStore, cacheValue: cache.TtlCache<SlaSlot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaSlot | undefined {
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

  save(item: SlaSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaSlot[] {
    return this.inner.list();
  }
}

export function newCachedSlaSlotStore(inner: SlaSlotStore, ttl: number, clockValue: clock.Clock): SlaSlotStore {
  return new CachedSlaSlotStore(inner, cache.newTtlCache<SlaSlot>(64, ttl, clockValue), 0, 0);
}

/** Selects sla slots. Empty fields match all. */
export class SlaSlotQuery {
  segment: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minGraceDays: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaSlot): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaSlot[]): SlaSlot[] {
    const matched = collections.filter(items, (candidate: SlaSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaSlots(store: SlaSlotStore, query: SlaSlotQuery): SlaSlot[] {
  return query.apply(store.list());
}
