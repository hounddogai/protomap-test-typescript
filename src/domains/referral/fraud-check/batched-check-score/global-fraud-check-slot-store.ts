import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalFraudCheckSlot } from "./global-fraud-check-slot.js";

/** Keeps global fraud check slots by code. */
export interface GlobalFraudCheckSlotStore {
  find(code: string): GlobalFraudCheckSlot | undefined;
  save(item: GlobalFraudCheckSlot): void;
  remove(code: string): boolean;
  list(): GlobalFraudCheckSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalFraudCheckSlotStore implements GlobalFraudCheckSlotStore {
  items: Map<string, GlobalFraudCheckSlot>;
  order: string[];

  constructor(items: Map<string, GlobalFraudCheckSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalFraudCheckSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalFraudCheckSlot): void {
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

  list(): GlobalFraudCheckSlot[] {
    const out: GlobalFraudCheckSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalFraudCheckSlotStore(): GlobalFraudCheckSlotStore {
  return new MemoryGlobalFraudCheckSlotStore(new Map<string, GlobalFraudCheckSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalFraudCheckSlotStore implements GlobalFraudCheckSlotStore {
  inner: GlobalFraudCheckSlotStore;
  cache: cache.TtlCache<GlobalFraudCheckSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalFraudCheckSlotStore,
    cacheValue: cache.TtlCache<GlobalFraudCheckSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalFraudCheckSlot | undefined {
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

  save(item: GlobalFraudCheckSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalFraudCheckSlot[] {
    return this.inner.list();
  }
}

export function newCachedGlobalFraudCheckSlotStore(inner: GlobalFraudCheckSlotStore, ttl: number, clockValue: clock.Clock): GlobalFraudCheckSlotStore {
  return new CachedGlobalFraudCheckSlotStore(
    inner,
    cache.newTtlCache<GlobalFraudCheckSlot>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global fraud check slots. Empty fields match all. */
export class GlobalFraudCheckSlotQuery {
  title: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minScore: number, statuses: string[], limit: number) {
    this.title = title;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalFraudCheckSlot): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalFraudCheckSlot[]): GlobalFraudCheckSlot[] {
    const matched = collections.filter(items, (candidate: GlobalFraudCheckSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalFraudCheckSlots(store: GlobalFraudCheckSlotStore, query: GlobalFraudCheckSlotQuery): GlobalFraudCheckSlot[] {
  return query.apply(store.list());
}
