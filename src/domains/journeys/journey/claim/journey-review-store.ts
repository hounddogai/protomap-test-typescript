import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { JourneyReview } from "./journey-review.js";

/** Keeps journey reviews by code. */
export interface JourneyReviewStore {
  find(code: string): JourneyReview | undefined;
  save(item: JourneyReview): void;
  remove(code: string): boolean;
  list(): JourneyReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryJourneyReviewStore implements JourneyReviewStore {
  items: Map<string, JourneyReview>;
  order: string[];

  constructor(items: Map<string, JourneyReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): JourneyReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: JourneyReview): void {
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

  list(): JourneyReview[] {
    const out: JourneyReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryJourneyReviewStore(): JourneyReviewStore {
  return new MemoryJourneyReviewStore(new Map<string, JourneyReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedJourneyReviewStore implements JourneyReviewStore {
  inner: JourneyReviewStore;
  cache: cache.TtlCache<JourneyReview>;
  hits: number;
  misses: number;

  constructor(inner: JourneyReviewStore, cacheValue: cache.TtlCache<JourneyReview>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): JourneyReview | undefined {
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

  save(item: JourneyReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): JourneyReview[] {
    return this.inner.list();
  }
}

export function newCachedJourneyReviewStore(inner: JourneyReviewStore, ttl: number, clockValue: clock.Clock): JourneyReviewStore {
  return new CachedJourneyReviewStore(inner, cache.newTtlCache<JourneyReview>(64, ttl, clockValue), 0, 0);
}

/** Selects journey reviews. Empty fields match all. */
export class JourneyReviewQuery {
  title: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCost: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: JourneyReview): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: JourneyReview[]): JourneyReview[] {
    const matched = collections.filter(items, (candidate: JourneyReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findJourneyReviews(store: JourneyReviewStore, query: JourneyReviewQuery): JourneyReview[] {
  return query.apply(store.list());
}
