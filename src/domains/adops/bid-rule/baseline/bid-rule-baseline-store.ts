import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleBaseline } from "./bid-rule-baseline.js";

/** Keeps bid rule baselines by code. */
export interface BidRuleBaselineStore {
  find(code: string): BidRuleBaseline | undefined;
  save(item: BidRuleBaseline): void;
  remove(code: string): boolean;
  list(): BidRuleBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleBaselineStore implements BidRuleBaselineStore {
  items: Map<string, BidRuleBaseline>;
  order: string[];

  constructor(items: Map<string, BidRuleBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleBaseline): void {
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

  list(): BidRuleBaseline[] {
    const out: BidRuleBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleBaselineStore(): BidRuleBaselineStore {
  return new MemoryBidRuleBaselineStore(new Map<string, BidRuleBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleBaselineStore implements BidRuleBaselineStore {
  inner: BidRuleBaselineStore;
  cache: cache.TtlCache<BidRuleBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: BidRuleBaselineStore,
    cacheValue: cache.TtlCache<BidRuleBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleBaseline | undefined {
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

  save(item: BidRuleBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleBaseline[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleBaselineStore(inner: BidRuleBaselineStore, ttl: number, clockValue: clock.Clock): BidRuleBaselineStore {
  return new CachedBidRuleBaselineStore(inner, cache.newTtlCache<BidRuleBaseline>(128, ttl, clockValue), 0, 0);
}

/** Selects bid rule baselines. Empty fields match all. */
export class BidRuleBaselineQuery {
  name: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleBaseline): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleBaseline[]): BidRuleBaseline[] {
    const matched = collections.filter(items, (candidate: BidRuleBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleBaselines(store: BidRuleBaselineStore, query: BidRuleBaselineQuery): BidRuleBaseline[] {
  return query.apply(store.list());
}
