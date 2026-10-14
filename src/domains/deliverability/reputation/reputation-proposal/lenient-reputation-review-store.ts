import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientReputationReview } from "./lenient-reputation-review.js";

/** Keeps lenient reputation reviews by code. */
export interface LenientReputationReviewStore {
  find(code: string): LenientReputationReview | undefined;
  save(item: LenientReputationReview): void;
  remove(code: string): boolean;
  list(): LenientReputationReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientReputationReviewStore implements LenientReputationReviewStore {
  items: Map<string, LenientReputationReview>;
  order: string[];

  constructor(items: Map<string, LenientReputationReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientReputationReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientReputationReview): void {
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

  list(): LenientReputationReview[] {
    const out: LenientReputationReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientReputationReviewStore(): LenientReputationReviewStore {
  return new MemoryLenientReputationReviewStore(new Map<string, LenientReputationReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientReputationReviewStore implements LenientReputationReviewStore {
  inner: LenientReputationReviewStore;
  cache: cache.TtlCache<LenientReputationReview>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientReputationReviewStore,
    cacheValue: cache.TtlCache<LenientReputationReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientReputationReview | undefined {
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

  save(item: LenientReputationReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientReputationReview[] {
    return this.inner.list();
  }
}

export function newCachedLenientReputationReviewStore(inner: LenientReputationReviewStore, ttl: number, clockValue: clock.Clock): LenientReputationReviewStore {
  return new CachedLenientReputationReviewStore(
    inner,
    cache.newTtlCache<LenientReputationReview>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient reputation reviews. Empty fields match all. */
export class LenientReputationReviewQuery {
  unit: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minBudget: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientReputationReview): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientReputationReview[]): LenientReputationReview[] {
    const matched = collections.filter(items, (candidate: LenientReputationReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientReputationReviews(store: LenientReputationReviewStore, query: LenientReputationReviewQuery): LenientReputationReview[] {
  return query.apply(store.list());
}
