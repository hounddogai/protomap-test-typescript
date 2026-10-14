import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathReview } from "./path-review.js";

/** Keeps path reviews by code. */
export interface PathReviewStore {
  find(code: string): PathReview | undefined;
  save(item: PathReview): void;
  remove(code: string): boolean;
  list(): PathReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathReviewStore implements PathReviewStore {
  items: Map<string, PathReview>;
  order: string[];

  constructor(items: Map<string, PathReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathReview): void {
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

  list(): PathReview[] {
    const out: PathReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathReviewStore(): PathReviewStore {
  return new MemoryPathReviewStore(new Map<string, PathReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathReviewStore implements PathReviewStore {
  inner: PathReviewStore;
  cache: cache.TtlCache<PathReview>;
  hits: number;
  misses: number;

  constructor(inner: PathReviewStore, cacheValue: cache.TtlCache<PathReview>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathReview | undefined {
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

  save(item: PathReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathReview[] {
    return this.inner.list();
  }
}

export function newCachedPathReviewStore(inner: PathReviewStore, ttl: number, clockValue: clock.Clock): PathReviewStore {
  return new CachedPathReviewStore(inner, cache.newTtlCache<PathReview>(1024, ttl, clockValue), 0, 0);
}

/** Selects path reviews. Empty fields match all. */
export class PathReviewQuery {
  locale: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBudget: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathReview): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathReview[]): PathReview[] {
    const matched = collections.filter(items, (candidate: PathReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathReviews(store: PathReviewStore, query: PathReviewQuery): PathReview[] {
  return query.apply(store.list());
}
