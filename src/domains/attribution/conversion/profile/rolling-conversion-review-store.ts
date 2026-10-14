import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingConversionReview } from "./rolling-conversion-review.js";

/** Keeps rolling conversion reviews by code. */
export interface RollingConversionReviewStore {
  find(code: string): RollingConversionReview | undefined;
  save(item: RollingConversionReview): void;
  remove(code: string): boolean;
  list(): RollingConversionReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingConversionReviewStore implements RollingConversionReviewStore {
  items: Map<string, RollingConversionReview>;
  order: string[];

  constructor(items: Map<string, RollingConversionReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingConversionReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingConversionReview): void {
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

  list(): RollingConversionReview[] {
    const out: RollingConversionReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingConversionReviewStore(): RollingConversionReviewStore {
  return new MemoryRollingConversionReviewStore(new Map<string, RollingConversionReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingConversionReviewStore implements RollingConversionReviewStore {
  inner: RollingConversionReviewStore;
  cache: cache.TtlCache<RollingConversionReview>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingConversionReviewStore,
    cacheValue: cache.TtlCache<RollingConversionReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingConversionReview | undefined {
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

  save(item: RollingConversionReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingConversionReview[] {
    return this.inner.list();
  }
}

export function newCachedRollingConversionReviewStore(inner: RollingConversionReviewStore, ttl: number, clockValue: clock.Clock): RollingConversionReviewStore {
  return new CachedRollingConversionReviewStore(
    inner,
    cache.newTtlCache<RollingConversionReview>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling conversion reviews. Empty fields match all. */
export class RollingConversionReviewQuery {
  title: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minGraceDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingConversionReview): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingConversionReview[]): RollingConversionReview[] {
    const matched = collections.filter(items, (candidate: RollingConversionReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingConversionReviews(store: RollingConversionReviewStore, query: RollingConversionReviewQuery): RollingConversionReview[] {
  return query.apply(store.list());
}
