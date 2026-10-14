import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingOptOutReview } from "./rolling-opt-out-review.js";

/** Keeps rolling opt out reviews by code. */
export interface RollingOptOutReviewStore {
  find(code: string): RollingOptOutReview | undefined;
  save(item: RollingOptOutReview): void;
  remove(code: string): boolean;
  list(): RollingOptOutReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingOptOutReviewStore implements RollingOptOutReviewStore {
  items: Map<string, RollingOptOutReview>;
  order: string[];

  constructor(items: Map<string, RollingOptOutReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingOptOutReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingOptOutReview): void {
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

  list(): RollingOptOutReview[] {
    const out: RollingOptOutReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingOptOutReviewStore(): RollingOptOutReviewStore {
  return new MemoryRollingOptOutReviewStore(new Map<string, RollingOptOutReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingOptOutReviewStore implements RollingOptOutReviewStore {
  inner: RollingOptOutReviewStore;
  cache: cache.TtlCache<RollingOptOutReview>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingOptOutReviewStore,
    cacheValue: cache.TtlCache<RollingOptOutReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingOptOutReview | undefined {
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

  save(item: RollingOptOutReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingOptOutReview[] {
    return this.inner.list();
  }
}

export function newCachedRollingOptOutReviewStore(inner: RollingOptOutReviewStore, ttl: number, clockValue: clock.Clock): RollingOptOutReviewStore {
  return new CachedRollingOptOutReviewStore(inner, cache.newTtlCache<RollingOptOutReview>(64, ttl, clockValue), 0, 0);
}

/** Selects rolling opt out reviews. Empty fields match all. */
export class RollingOptOutReviewQuery {
  segment: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minMaximum: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingOptOutReview): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingOptOutReview[]): RollingOptOutReview[] {
    const matched = collections.filter(items, (candidate: RollingOptOutReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingOptOutReviews(store: RollingOptOutReviewStore, query: RollingOptOutReviewQuery): RollingOptOutReview[] {
  return query.apply(store.list());
}
