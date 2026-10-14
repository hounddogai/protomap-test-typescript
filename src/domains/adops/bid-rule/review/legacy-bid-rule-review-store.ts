import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyBidRuleReview } from "./legacy-bid-rule-review.js";

/** Keeps legacy bid rule reviews by code. */
export interface LegacyBidRuleReviewStore {
  find(code: string): LegacyBidRuleReview | undefined;
  save(item: LegacyBidRuleReview): void;
  remove(code: string): boolean;
  list(): LegacyBidRuleReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyBidRuleReviewStore implements LegacyBidRuleReviewStore {
  items: Map<string, LegacyBidRuleReview>;
  order: string[];

  constructor(items: Map<string, LegacyBidRuleReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyBidRuleReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyBidRuleReview): void {
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

  list(): LegacyBidRuleReview[] {
    const out: LegacyBidRuleReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyBidRuleReviewStore(): LegacyBidRuleReviewStore {
  return new MemoryLegacyBidRuleReviewStore(new Map<string, LegacyBidRuleReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyBidRuleReviewStore implements LegacyBidRuleReviewStore {
  inner: LegacyBidRuleReviewStore;
  cache: cache.TtlCache<LegacyBidRuleReview>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyBidRuleReviewStore,
    cacheValue: cache.TtlCache<LegacyBidRuleReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyBidRuleReview | undefined {
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

  save(item: LegacyBidRuleReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyBidRuleReview[] {
    return this.inner.list();
  }
}

export function newCachedLegacyBidRuleReviewStore(inner: LegacyBidRuleReviewStore, ttl: number, clockValue: clock.Clock): LegacyBidRuleReviewStore {
  return new CachedLegacyBidRuleReviewStore(inner, cache.newTtlCache<LegacyBidRuleReview>(512, ttl, clockValue), 0, 0);
}

/** Selects legacy bid rule reviews. Empty fields match all. */
export class LegacyBidRuleReviewQuery {
  locale: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minThreshold: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyBidRuleReview): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyBidRuleReview[]): LegacyBidRuleReview[] {
    const matched = collections.filter(items, (candidate: LegacyBidRuleReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyBidRuleReviews(store: LegacyBidRuleReviewStore, query: LegacyBidRuleReviewQuery): LegacyBidRuleReview[] {
  return query.apply(store.list());
}
