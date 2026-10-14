import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyPreferenceReview } from "./legacy-preference-review.js";

/** Keeps legacy preference reviews by code. */
export interface LegacyPreferenceReviewStore {
  find(code: string): LegacyPreferenceReview | undefined;
  save(item: LegacyPreferenceReview): void;
  remove(code: string): boolean;
  list(): LegacyPreferenceReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyPreferenceReviewStore implements LegacyPreferenceReviewStore {
  items: Map<string, LegacyPreferenceReview>;
  order: string[];

  constructor(items: Map<string, LegacyPreferenceReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyPreferenceReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyPreferenceReview): void {
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

  list(): LegacyPreferenceReview[] {
    const out: LegacyPreferenceReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyPreferenceReviewStore(): LegacyPreferenceReviewStore {
  return new MemoryLegacyPreferenceReviewStore(new Map<string, LegacyPreferenceReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyPreferenceReviewStore implements LegacyPreferenceReviewStore {
  inner: LegacyPreferenceReviewStore;
  cache: cache.TtlCache<LegacyPreferenceReview>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyPreferenceReviewStore,
    cacheValue: cache.TtlCache<LegacyPreferenceReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyPreferenceReview | undefined {
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

  save(item: LegacyPreferenceReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyPreferenceReview[] {
    return this.inner.list();
  }
}

export function newCachedLegacyPreferenceReviewStore(inner: LegacyPreferenceReviewStore, ttl: number, clockValue: clock.Clock): LegacyPreferenceReviewStore {
  return new CachedLegacyPreferenceReviewStore(
    inner,
    cache.newTtlCache<LegacyPreferenceReview>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy preference reviews. Empty fields match all. */
export class LegacyPreferenceReviewQuery {
  category: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minCeiling: number, statuses: string[], limit: number) {
    this.category = category;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyPreferenceReview): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyPreferenceReview[]): LegacyPreferenceReview[] {
    const matched = collections.filter(items, (candidate: LegacyPreferenceReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyPreferenceReviews(store: LegacyPreferenceReviewStore, query: LegacyPreferenceReviewQuery): LegacyPreferenceReview[] {
  return query.apply(store.list());
}
