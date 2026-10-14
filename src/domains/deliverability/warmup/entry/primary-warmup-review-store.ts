import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryWarmupReview } from "./primary-warmup-review.js";

/** Keeps primary warmup reviews by code. */
export interface PrimaryWarmupReviewStore {
  find(code: string): PrimaryWarmupReview | undefined;
  save(item: PrimaryWarmupReview): void;
  remove(code: string): boolean;
  list(): PrimaryWarmupReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryWarmupReviewStore implements PrimaryWarmupReviewStore {
  items: Map<string, PrimaryWarmupReview>;
  order: string[];

  constructor(items: Map<string, PrimaryWarmupReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryWarmupReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryWarmupReview): void {
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

  list(): PrimaryWarmupReview[] {
    const out: PrimaryWarmupReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryWarmupReviewStore(): PrimaryWarmupReviewStore {
  return new MemoryPrimaryWarmupReviewStore(new Map<string, PrimaryWarmupReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryWarmupReviewStore implements PrimaryWarmupReviewStore {
  inner: PrimaryWarmupReviewStore;
  cache: cache.TtlCache<PrimaryWarmupReview>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryWarmupReviewStore,
    cacheValue: cache.TtlCache<PrimaryWarmupReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryWarmupReview | undefined {
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

  save(item: PrimaryWarmupReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryWarmupReview[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryWarmupReviewStore(inner: PrimaryWarmupReviewStore, ttl: number, clockValue: clock.Clock): PrimaryWarmupReviewStore {
  return new CachedPrimaryWarmupReviewStore(inner, cache.newTtlCache<PrimaryWarmupReview>(256, ttl, clockValue), 0, 0);
}

/** Selects primary warmup reviews. Empty fields match all. */
export class PrimaryWarmupReviewQuery {
  unit: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minPriority: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryWarmupReview): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryWarmupReview[]): PrimaryWarmupReview[] {
    const matched = collections.filter(items, (candidate: PrimaryWarmupReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryWarmupReviews(store: PrimaryWarmupReviewStore, query: PrimaryWarmupReviewQuery): PrimaryWarmupReview[] {
  return query.apply(store.list());
}
