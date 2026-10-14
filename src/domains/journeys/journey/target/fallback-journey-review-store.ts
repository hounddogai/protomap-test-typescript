import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackJourneyReview } from "./fallback-journey-review.js";

/** Keeps fallback journey reviews by code. */
export interface FallbackJourneyReviewStore {
  find(code: string): FallbackJourneyReview | undefined;
  save(item: FallbackJourneyReview): void;
  remove(code: string): boolean;
  list(): FallbackJourneyReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackJourneyReviewStore implements FallbackJourneyReviewStore {
  items: Map<string, FallbackJourneyReview>;
  order: string[];

  constructor(items: Map<string, FallbackJourneyReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackJourneyReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackJourneyReview): void {
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

  list(): FallbackJourneyReview[] {
    const out: FallbackJourneyReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackJourneyReviewStore(): FallbackJourneyReviewStore {
  return new MemoryFallbackJourneyReviewStore(new Map<string, FallbackJourneyReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackJourneyReviewStore implements FallbackJourneyReviewStore {
  inner: FallbackJourneyReviewStore;
  cache: cache.TtlCache<FallbackJourneyReview>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackJourneyReviewStore,
    cacheValue: cache.TtlCache<FallbackJourneyReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackJourneyReview | undefined {
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

  save(item: FallbackJourneyReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackJourneyReview[] {
    return this.inner.list();
  }
}

export function newCachedFallbackJourneyReviewStore(inner: FallbackJourneyReviewStore, ttl: number, clockValue: clock.Clock): FallbackJourneyReviewStore {
  return new CachedFallbackJourneyReviewStore(
    inner,
    cache.newTtlCache<FallbackJourneyReview>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback journey reviews. Empty fields match all. */
export class FallbackJourneyReviewQuery {
  channel: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackJourneyReview): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackJourneyReview[]): FallbackJourneyReview[] {
    const matched = collections.filter(items, (candidate: FallbackJourneyReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackJourneyReviews(store: FallbackJourneyReviewStore, query: FallbackJourneyReviewQuery): FallbackJourneyReview[] {
  return query.apply(store.list());
}
