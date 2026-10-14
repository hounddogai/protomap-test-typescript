import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedWindowReview } from "./weighted-window-review.js";

/** Keeps weighted window reviews by code. */
export interface WeightedWindowReviewStore {
  find(code: string): WeightedWindowReview | undefined;
  save(item: WeightedWindowReview): void;
  remove(code: string): boolean;
  list(): WeightedWindowReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedWindowReviewStore implements WeightedWindowReviewStore {
  items: Map<string, WeightedWindowReview>;
  order: string[];

  constructor(items: Map<string, WeightedWindowReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedWindowReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedWindowReview): void {
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

  list(): WeightedWindowReview[] {
    const out: WeightedWindowReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedWindowReviewStore(): WeightedWindowReviewStore {
  return new MemoryWeightedWindowReviewStore(new Map<string, WeightedWindowReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedWindowReviewStore implements WeightedWindowReviewStore {
  inner: WeightedWindowReviewStore;
  cache: cache.TtlCache<WeightedWindowReview>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedWindowReviewStore,
    cacheValue: cache.TtlCache<WeightedWindowReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedWindowReview | undefined {
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

  save(item: WeightedWindowReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedWindowReview[] {
    return this.inner.list();
  }
}

export function newCachedWeightedWindowReviewStore(inner: WeightedWindowReviewStore, ttl: number, clockValue: clock.Clock): WeightedWindowReviewStore {
  return new CachedWeightedWindowReviewStore(
    inner,
    cache.newTtlCache<WeightedWindowReview>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted window reviews. Empty fields match all. */
export class WeightedWindowReviewQuery {
  channel: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minSendAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedWindowReview): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedWindowReview[]): WeightedWindowReview[] {
    const matched = collections.filter(items, (candidate: WeightedWindowReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedWindowReviews(store: WeightedWindowReviewStore, query: WeightedWindowReviewQuery): WeightedWindowReview[] {
  return query.apply(store.list());
}
