import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencyReview } from "./frequency-review.js";

/** Keeps frequency reviews by code. */
export interface FrequencyReviewStore {
  find(code: string): FrequencyReview | undefined;
  save(item: FrequencyReview): void;
  remove(code: string): boolean;
  list(): FrequencyReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencyReviewStore implements FrequencyReviewStore {
  items: Map<string, FrequencyReview>;
  order: string[];

  constructor(items: Map<string, FrequencyReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencyReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencyReview): void {
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

  list(): FrequencyReview[] {
    const out: FrequencyReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencyReviewStore(): FrequencyReviewStore {
  return new MemoryFrequencyReviewStore(new Map<string, FrequencyReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencyReviewStore implements FrequencyReviewStore {
  inner: FrequencyReviewStore;
  cache: cache.TtlCache<FrequencyReview>;
  hits: number;
  misses: number;

  constructor(
    inner: FrequencyReviewStore,
    cacheValue: cache.TtlCache<FrequencyReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencyReview | undefined {
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

  save(item: FrequencyReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencyReview[] {
    return this.inner.list();
  }
}

export function newCachedFrequencyReviewStore(inner: FrequencyReviewStore, ttl: number, clockValue: clock.Clock): FrequencyReviewStore {
  return new CachedFrequencyReviewStore(inner, cache.newTtlCache<FrequencyReview>(64, ttl, clockValue), 0, 0);
}

/** Selects frequency reviews. Empty fields match all. */
export class FrequencyReviewQuery {
  region: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minFloorValue: number, statuses: string[], limit: number) {
    this.region = region;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencyReview): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencyReview[]): FrequencyReview[] {
    const matched = collections.filter(items, (candidate: FrequencyReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencyReviews(store: FrequencyReviewStore, query: FrequencyReviewQuery): FrequencyReview[] {
  return query.apply(store.list());
}
