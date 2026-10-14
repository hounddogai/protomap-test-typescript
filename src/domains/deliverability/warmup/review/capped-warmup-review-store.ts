import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedWarmupReview } from "./capped-warmup-review.js";

/** Keeps capped warmup reviews by code. */
export interface CappedWarmupReviewStore {
  find(code: string): CappedWarmupReview | undefined;
  save(item: CappedWarmupReview): void;
  remove(code: string): boolean;
  list(): CappedWarmupReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedWarmupReviewStore implements CappedWarmupReviewStore {
  items: Map<string, CappedWarmupReview>;
  order: string[];

  constructor(items: Map<string, CappedWarmupReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedWarmupReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedWarmupReview): void {
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

  list(): CappedWarmupReview[] {
    const out: CappedWarmupReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedWarmupReviewStore(): CappedWarmupReviewStore {
  return new MemoryCappedWarmupReviewStore(new Map<string, CappedWarmupReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedWarmupReviewStore implements CappedWarmupReviewStore {
  inner: CappedWarmupReviewStore;
  cache: cache.TtlCache<CappedWarmupReview>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedWarmupReviewStore,
    cacheValue: cache.TtlCache<CappedWarmupReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedWarmupReview | undefined {
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

  save(item: CappedWarmupReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedWarmupReview[] {
    return this.inner.list();
  }
}

export function newCachedCappedWarmupReviewStore(inner: CappedWarmupReviewStore, ttl: number, clockValue: clock.Clock): CappedWarmupReviewStore {
  return new CachedCappedWarmupReviewStore(inner, cache.newTtlCache<CappedWarmupReview>(1024, ttl, clockValue), 0, 0);
}

/** Selects capped warmup reviews. Empty fields match all. */
export class CappedWarmupReviewQuery {
  unit: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minWeight: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedWarmupReview): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedWarmupReview[]): CappedWarmupReview[] {
    const matched = collections.filter(items, (candidate: CappedWarmupReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedWarmupReviews(store: CappedWarmupReviewStore, query: CappedWarmupReviewQuery): CappedWarmupReview[] {
  return query.apply(store.list());
}
