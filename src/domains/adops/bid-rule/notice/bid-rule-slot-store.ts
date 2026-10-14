import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleSlot } from "./bid-rule-slot.js";

/** Keeps bid rule slots by code. */
export interface BidRuleSlotStore {
  find(code: string): BidRuleSlot | undefined;
  save(item: BidRuleSlot): void;
  remove(code: string): boolean;
  list(): BidRuleSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleSlotStore implements BidRuleSlotStore {
  items: Map<string, BidRuleSlot>;
  order: string[];

  constructor(items: Map<string, BidRuleSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleSlot): void {
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

  list(): BidRuleSlot[] {
    const out: BidRuleSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleSlotStore(): BidRuleSlotStore {
  return new MemoryBidRuleSlotStore(new Map<string, BidRuleSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleSlotStore implements BidRuleSlotStore {
  inner: BidRuleSlotStore;
  cache: cache.TtlCache<BidRuleSlot>;
  hits: number;
  misses: number;

  constructor(inner: BidRuleSlotStore, cacheValue: cache.TtlCache<BidRuleSlot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleSlot | undefined {
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

  save(item: BidRuleSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleSlot[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleSlotStore(inner: BidRuleSlotStore, ttl: number, clockValue: clock.Clock): BidRuleSlotStore {
  return new CachedBidRuleSlotStore(inner, cache.newTtlCache<BidRuleSlot>(256, ttl, clockValue), 0, 0);
}

/** Selects bid rule slots. Empty fields match all. */
export class BidRuleSlotQuery {
  channel: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minConversionRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleSlot): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleSlot[]): BidRuleSlot[] {
    const matched = collections.filter(items, (candidate: BidRuleSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleSlots(store: BidRuleSlotStore, query: BidRuleSlotQuery): BidRuleSlot[] {
  return query.apply(store.list());
}
