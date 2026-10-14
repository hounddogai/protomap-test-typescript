import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionReview } from "./deflection-review.js";

/** Keeps deflection reviews by code. */
export interface DeflectionReviewStore {
  find(code: string): DeflectionReview | undefined;
  save(item: DeflectionReview): void;
  remove(code: string): boolean;
  list(): DeflectionReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionReviewStore implements DeflectionReviewStore {
  items: Map<string, DeflectionReview>;
  order: string[];

  constructor(items: Map<string, DeflectionReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionReview): void {
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

  list(): DeflectionReview[] {
    const out: DeflectionReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionReviewStore(): DeflectionReviewStore {
  return new MemoryDeflectionReviewStore(new Map<string, DeflectionReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionReviewStore implements DeflectionReviewStore {
  inner: DeflectionReviewStore;
  cache: cache.TtlCache<DeflectionReview>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionReviewStore,
    cacheValue: cache.TtlCache<DeflectionReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionReview | undefined {
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

  save(item: DeflectionReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionReview[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionReviewStore(inner: DeflectionReviewStore, ttl: number, clockValue: clock.Clock): DeflectionReviewStore {
  return new CachedDeflectionReviewStore(inner, cache.newTtlCache<DeflectionReview>(512, ttl, clockValue), 0, 0);
}

/** Selects deflection reviews. Empty fields match all. */
export class DeflectionReviewQuery {
  segment: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minScore: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionReview): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionReview[]): DeflectionReview[] {
    const matched = collections.filter(items, (candidate: DeflectionReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionReviews(store: DeflectionReviewStore, query: DeflectionReviewQuery): DeflectionReview[] {
  return query.apply(store.list());
}
