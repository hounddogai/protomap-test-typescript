import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightReview } from "./flight-review.js";

/** Keeps flight reviews by code. */
export interface FlightReviewStore {
  find(code: string): FlightReview | undefined;
  save(item: FlightReview): void;
  remove(code: string): boolean;
  list(): FlightReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightReviewStore implements FlightReviewStore {
  items: Map<string, FlightReview>;
  order: string[];

  constructor(items: Map<string, FlightReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightReview): void {
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

  list(): FlightReview[] {
    const out: FlightReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightReviewStore(): FlightReviewStore {
  return new MemoryFlightReviewStore(new Map<string, FlightReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightReviewStore implements FlightReviewStore {
  inner: FlightReviewStore;
  cache: cache.TtlCache<FlightReview>;
  hits: number;
  misses: number;

  constructor(inner: FlightReviewStore, cacheValue: cache.TtlCache<FlightReview>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightReview | undefined {
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

  save(item: FlightReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightReview[] {
    return this.inner.list();
  }
}

export function newCachedFlightReviewStore(inner: FlightReviewStore, ttl: number, clockValue: clock.Clock): FlightReviewStore {
  return new CachedFlightReviewStore(inner, cache.newTtlCache<FlightReview>(512, ttl, clockValue), 0, 0);
}

/** Selects flight reviews. Empty fields match all. */
export class FlightReviewQuery {
  label: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightReview): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightReview[]): FlightReview[] {
    const matched = collections.filter(items, (candidate: FlightReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightReviews(store: FlightReviewStore, query: FlightReviewQuery): FlightReview[] {
  return query.apply(store.list());
}
