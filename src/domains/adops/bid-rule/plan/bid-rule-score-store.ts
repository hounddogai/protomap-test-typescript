import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleScore } from "./bid-rule-score.js";

/** Keeps bid rule scores by code. */
export interface BidRuleScoreStore {
  find(code: string): BidRuleScore | undefined;
  save(item: BidRuleScore): void;
  remove(code: string): boolean;
  list(): BidRuleScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleScoreStore implements BidRuleScoreStore {
  items: Map<string, BidRuleScore>;
  order: string[];

  constructor(items: Map<string, BidRuleScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleScore): void {
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

  list(): BidRuleScore[] {
    const out: BidRuleScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleScoreStore(): BidRuleScoreStore {
  return new MemoryBidRuleScoreStore(new Map<string, BidRuleScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleScoreStore implements BidRuleScoreStore {
  inner: BidRuleScoreStore;
  cache: cache.TtlCache<BidRuleScore>;
  hits: number;
  misses: number;

  constructor(inner: BidRuleScoreStore, cacheValue: cache.TtlCache<BidRuleScore>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleScore | undefined {
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

  save(item: BidRuleScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleScore[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleScoreStore(inner: BidRuleScoreStore, ttl: number, clockValue: clock.Clock): BidRuleScoreStore {
  return new CachedBidRuleScoreStore(inner, cache.newTtlCache<BidRuleScore>(1024, ttl, clockValue), 0, 0);
}

/** Selects bid rule scores. Empty fields match all. */
export class BidRuleScoreQuery {
  locale: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minScore: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleScore): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleScore[]): BidRuleScore[] {
    const matched = collections.filter(items, (candidate: BidRuleScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleScores(store: BidRuleScoreStore, query: BidRuleScoreQuery): BidRuleScore[] {
  return query.apply(store.list());
}
