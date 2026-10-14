import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptivePreferenceReview } from "./adaptive-preference-review.js";

/** Keeps adaptive preference reviews by code. */
export interface AdaptivePreferenceReviewStore {
  find(code: string): AdaptivePreferenceReview | undefined;
  save(item: AdaptivePreferenceReview): void;
  remove(code: string): boolean;
  list(): AdaptivePreferenceReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptivePreferenceReviewStore implements AdaptivePreferenceReviewStore {
  items: Map<string, AdaptivePreferenceReview>;
  order: string[];

  constructor(items: Map<string, AdaptivePreferenceReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptivePreferenceReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptivePreferenceReview): void {
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

  list(): AdaptivePreferenceReview[] {
    const out: AdaptivePreferenceReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptivePreferenceReviewStore(): AdaptivePreferenceReviewStore {
  return new MemoryAdaptivePreferenceReviewStore(new Map<string, AdaptivePreferenceReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptivePreferenceReviewStore implements AdaptivePreferenceReviewStore {
  inner: AdaptivePreferenceReviewStore;
  cache: cache.TtlCache<AdaptivePreferenceReview>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptivePreferenceReviewStore,
    cacheValue: cache.TtlCache<AdaptivePreferenceReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptivePreferenceReview | undefined {
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

  save(item: AdaptivePreferenceReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptivePreferenceReview[] {
    return this.inner.list();
  }
}

export function newCachedAdaptivePreferenceReviewStore(inner: AdaptivePreferenceReviewStore, ttl: number, clockValue: clock.Clock): AdaptivePreferenceReviewStore {
  return new CachedAdaptivePreferenceReviewStore(
    inner,
    cache.newTtlCache<AdaptivePreferenceReview>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive preference reviews. Empty fields match all. */
export class AdaptivePreferenceReviewQuery {
  channel: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minGraceDays: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptivePreferenceReview): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptivePreferenceReview[]): AdaptivePreferenceReview[] {
    const matched = collections.filter(items, (candidate: AdaptivePreferenceReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptivePreferenceReviews(store: AdaptivePreferenceReviewStore, query: AdaptivePreferenceReviewQuery): AdaptivePreferenceReview[] {
  return query.apply(store.list());
}
