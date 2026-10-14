import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TouchpointReview } from "./touchpoint-review.js";

/** Keeps touchpoint reviews by code. */
export interface TouchpointReviewStore {
  find(code: string): TouchpointReview | undefined;
  save(item: TouchpointReview): void;
  remove(code: string): boolean;
  list(): TouchpointReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTouchpointReviewStore implements TouchpointReviewStore {
  items: Map<string, TouchpointReview>;
  order: string[];

  constructor(items: Map<string, TouchpointReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TouchpointReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TouchpointReview): void {
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

  list(): TouchpointReview[] {
    const out: TouchpointReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTouchpointReviewStore(): TouchpointReviewStore {
  return new MemoryTouchpointReviewStore(new Map<string, TouchpointReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTouchpointReviewStore implements TouchpointReviewStore {
  inner: TouchpointReviewStore;
  cache: cache.TtlCache<TouchpointReview>;
  hits: number;
  misses: number;

  constructor(
    inner: TouchpointReviewStore,
    cacheValue: cache.TtlCache<TouchpointReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TouchpointReview | undefined {
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

  save(item: TouchpointReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TouchpointReview[] {
    return this.inner.list();
  }
}

export function newCachedTouchpointReviewStore(inner: TouchpointReviewStore, ttl: number, clockValue: clock.Clock): TouchpointReviewStore {
  return new CachedTouchpointReviewStore(inner, cache.newTtlCache<TouchpointReview>(256, ttl, clockValue), 0, 0);
}

/** Selects touchpoint reviews. Empty fields match all. */
export class TouchpointReviewQuery {
  title: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minWeight: number, statuses: string[], limit: number) {
    this.title = title;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TouchpointReview): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TouchpointReview[]): TouchpointReview[] {
    const matched = collections.filter(items, (candidate: TouchpointReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTouchpointReviews(store: TouchpointReviewStore, query: TouchpointReviewQuery): TouchpointReview[] {
  return query.apply(store.list());
}
