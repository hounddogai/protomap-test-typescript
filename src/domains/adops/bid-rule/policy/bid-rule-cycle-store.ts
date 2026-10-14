import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleCycle } from "./bid-rule-cycle.js";

/** Keeps bid rule cycles by code. */
export interface BidRuleCycleStore {
  find(code: string): BidRuleCycle | undefined;
  save(item: BidRuleCycle): void;
  remove(code: string): boolean;
  list(): BidRuleCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleCycleStore implements BidRuleCycleStore {
  items: Map<string, BidRuleCycle>;
  order: string[];

  constructor(items: Map<string, BidRuleCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleCycle): void {
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

  list(): BidRuleCycle[] {
    const out: BidRuleCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleCycleStore(): BidRuleCycleStore {
  return new MemoryBidRuleCycleStore(new Map<string, BidRuleCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleCycleStore implements BidRuleCycleStore {
  inner: BidRuleCycleStore;
  cache: cache.TtlCache<BidRuleCycle>;
  hits: number;
  misses: number;

  constructor(inner: BidRuleCycleStore, cacheValue: cache.TtlCache<BidRuleCycle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleCycle | undefined {
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

  save(item: BidRuleCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleCycle[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleCycleStore(inner: BidRuleCycleStore, ttl: number, clockValue: clock.Clock): BidRuleCycleStore {
  return new CachedBidRuleCycleStore(inner, cache.newTtlCache<BidRuleCycle>(512, ttl, clockValue), 0, 0);
}

/** Selects bid rule cycles. Empty fields match all. */
export class BidRuleCycleQuery {
  unit: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minWeight: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleCycle): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleCycle[]): BidRuleCycle[] {
    const matched = collections.filter(items, (candidate: BidRuleCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleCycles(store: BidRuleCycleStore, query: BidRuleCycleQuery): BidRuleCycle[] {
  return query.apply(store.list());
}
