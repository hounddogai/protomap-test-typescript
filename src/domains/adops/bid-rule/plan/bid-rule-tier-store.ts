import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleTier } from "./bid-rule-tier.js";

/** Keeps bid rule tiers by code. */
export interface BidRuleTierStore {
  find(code: string): BidRuleTier | undefined;
  save(item: BidRuleTier): void;
  remove(code: string): boolean;
  list(): BidRuleTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleTierStore implements BidRuleTierStore {
  items: Map<string, BidRuleTier>;
  order: string[];

  constructor(items: Map<string, BidRuleTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleTier): void {
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

  list(): BidRuleTier[] {
    const out: BidRuleTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleTierStore(): BidRuleTierStore {
  return new MemoryBidRuleTierStore(new Map<string, BidRuleTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleTierStore implements BidRuleTierStore {
  inner: BidRuleTierStore;
  cache: cache.TtlCache<BidRuleTier>;
  hits: number;
  misses: number;

  constructor(inner: BidRuleTierStore, cacheValue: cache.TtlCache<BidRuleTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleTier | undefined {
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

  save(item: BidRuleTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleTier[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleTierStore(inner: BidRuleTierStore, ttl: number, clockValue: clock.Clock): BidRuleTierStore {
  return new CachedBidRuleTierStore(inner, cache.newTtlCache<BidRuleTier>(64, ttl, clockValue), 0, 0);
}

/** Selects bid rule tiers. Empty fields match all. */
export class BidRuleTierQuery {
  locale: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAttempts: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleTier): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleTier[]): BidRuleTier[] {
    const matched = collections.filter(items, (candidate: BidRuleTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleTiers(store: BidRuleTierStore, query: BidRuleTierQuery): BidRuleTier[] {
  return query.apply(store.list());
}
