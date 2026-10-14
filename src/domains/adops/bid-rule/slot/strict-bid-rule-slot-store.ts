import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictBidRuleSlot } from "./strict-bid-rule-slot.js";

/** Keeps strict bid rule slots by code. */
export interface StrictBidRuleSlotStore {
  find(code: string): StrictBidRuleSlot | undefined;
  save(item: StrictBidRuleSlot): void;
  remove(code: string): boolean;
  list(): StrictBidRuleSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictBidRuleSlotStore implements StrictBidRuleSlotStore {
  items: Map<string, StrictBidRuleSlot>;
  order: string[];

  constructor(items: Map<string, StrictBidRuleSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictBidRuleSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictBidRuleSlot): void {
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

  list(): StrictBidRuleSlot[] {
    const out: StrictBidRuleSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictBidRuleSlotStore(): StrictBidRuleSlotStore {
  return new MemoryStrictBidRuleSlotStore(new Map<string, StrictBidRuleSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictBidRuleSlotStore implements StrictBidRuleSlotStore {
  inner: StrictBidRuleSlotStore;
  cache: cache.TtlCache<StrictBidRuleSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictBidRuleSlotStore,
    cacheValue: cache.TtlCache<StrictBidRuleSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictBidRuleSlot | undefined {
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

  save(item: StrictBidRuleSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictBidRuleSlot[] {
    return this.inner.list();
  }
}

export function newCachedStrictBidRuleSlotStore(inner: StrictBidRuleSlotStore, ttl: number, clockValue: clock.Clock): StrictBidRuleSlotStore {
  return new CachedStrictBidRuleSlotStore(inner, cache.newTtlCache<StrictBidRuleSlot>(1024, ttl, clockValue), 0, 0);
}

/** Selects strict bid rule slots. Empty fields match all. */
export class StrictBidRuleSlotQuery {
  title: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictBidRuleSlot): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictBidRuleSlot[]): StrictBidRuleSlot[] {
    const matched = collections.filter(items, (candidate: StrictBidRuleSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictBidRuleSlots(store: StrictBidRuleSlotStore, query: StrictBidRuleSlotQuery): StrictBidRuleSlot[] {
  return query.apply(store.list());
}
