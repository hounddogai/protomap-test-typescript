import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingNudgeReview } from "./rolling-nudge-review.js";

/** Keeps rolling nudge reviews by code. */
export interface RollingNudgeReviewStore {
  find(code: string): RollingNudgeReview | undefined;
  save(item: RollingNudgeReview): void;
  remove(code: string): boolean;
  list(): RollingNudgeReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingNudgeReviewStore implements RollingNudgeReviewStore {
  items: Map<string, RollingNudgeReview>;
  order: string[];

  constructor(items: Map<string, RollingNudgeReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingNudgeReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingNudgeReview): void {
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

  list(): RollingNudgeReview[] {
    const out: RollingNudgeReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingNudgeReviewStore(): RollingNudgeReviewStore {
  return new MemoryRollingNudgeReviewStore(new Map<string, RollingNudgeReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingNudgeReviewStore implements RollingNudgeReviewStore {
  inner: RollingNudgeReviewStore;
  cache: cache.TtlCache<RollingNudgeReview>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingNudgeReviewStore,
    cacheValue: cache.TtlCache<RollingNudgeReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingNudgeReview | undefined {
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

  save(item: RollingNudgeReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingNudgeReview[] {
    return this.inner.list();
  }
}

export function newCachedRollingNudgeReviewStore(inner: RollingNudgeReviewStore, ttl: number, clockValue: clock.Clock): RollingNudgeReviewStore {
  return new CachedRollingNudgeReviewStore(inner, cache.newTtlCache<RollingNudgeReview>(1024, ttl, clockValue), 0, 0);
}

/** Selects rolling nudge reviews. Empty fields match all. */
export class RollingNudgeReviewQuery {
  region: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minMargin: number, statuses: string[], limit: number) {
    this.region = region;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingNudgeReview): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingNudgeReview[]): RollingNudgeReview[] {
    const matched = collections.filter(items, (candidate: RollingNudgeReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingNudgeReviews(store: RollingNudgeReviewStore, query: RollingNudgeReviewQuery): RollingNudgeReview[] {
  return query.apply(store.list());
}
