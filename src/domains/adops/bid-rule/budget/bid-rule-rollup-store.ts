import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleRollup } from "./bid-rule-rollup.js";

/** Keeps bid rule rollups by code. */
export interface BidRuleRollupStore {
  find(code: string): BidRuleRollup | undefined;
  save(item: BidRuleRollup): void;
  remove(code: string): boolean;
  list(): BidRuleRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleRollupStore implements BidRuleRollupStore {
  items: Map<string, BidRuleRollup>;
  order: string[];

  constructor(items: Map<string, BidRuleRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleRollup): void {
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

  list(): BidRuleRollup[] {
    const out: BidRuleRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleRollupStore(): BidRuleRollupStore {
  return new MemoryBidRuleRollupStore(new Map<string, BidRuleRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleRollupStore implements BidRuleRollupStore {
  inner: BidRuleRollupStore;
  cache: cache.TtlCache<BidRuleRollup>;
  hits: number;
  misses: number;

  constructor(inner: BidRuleRollupStore, cacheValue: cache.TtlCache<BidRuleRollup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleRollup | undefined {
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

  save(item: BidRuleRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleRollup[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleRollupStore(inner: BidRuleRollupStore, ttl: number, clockValue: clock.Clock): BidRuleRollupStore {
  return new CachedBidRuleRollupStore(inner, cache.newTtlCache<BidRuleRollup>(1024, ttl, clockValue), 0, 0);
}

/** Selects bid rule rollups. Empty fields match all. */
export class BidRuleRollupQuery {
  category: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRevision: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleRollup): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleRollup[]): BidRuleRollup[] {
    const matched = collections.filter(items, (candidate: BidRuleRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleRollups(store: BidRuleRollupStore, query: BidRuleRollupQuery): BidRuleRollup[] {
  return query.apply(store.list());
}
