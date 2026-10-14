import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { OptOutReview } from "./opt-out-review.js";

/** Keeps opt out reviews by code. */
export interface OptOutReviewStore {
  find(code: string): OptOutReview | undefined;
  save(item: OptOutReview): void;
  remove(code: string): boolean;
  list(): OptOutReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryOptOutReviewStore implements OptOutReviewStore {
  items: Map<string, OptOutReview>;
  order: string[];

  constructor(items: Map<string, OptOutReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): OptOutReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: OptOutReview): void {
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

  list(): OptOutReview[] {
    const out: OptOutReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryOptOutReviewStore(): OptOutReviewStore {
  return new MemoryOptOutReviewStore(new Map<string, OptOutReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedOptOutReviewStore implements OptOutReviewStore {
  inner: OptOutReviewStore;
  cache: cache.TtlCache<OptOutReview>;
  hits: number;
  misses: number;

  constructor(inner: OptOutReviewStore, cacheValue: cache.TtlCache<OptOutReview>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): OptOutReview | undefined {
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

  save(item: OptOutReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): OptOutReview[] {
    return this.inner.list();
  }
}

export function newCachedOptOutReviewStore(inner: OptOutReviewStore, ttl: number, clockValue: clock.Clock): OptOutReviewStore {
  return new CachedOptOutReviewStore(inner, cache.newTtlCache<OptOutReview>(1024, ttl, clockValue), 0, 0);
}

/** Selects opt out reviews. Empty fields match all. */
export class OptOutReviewQuery {
  region: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minOpenRate: number, statuses: string[], limit: number) {
    this.region = region;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: OptOutReview): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: OptOutReview[]): OptOutReview[] {
    const matched = collections.filter(items, (candidate: OptOutReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findOptOutReviews(store: OptOutReviewStore, query: OptOutReviewQuery): OptOutReview[] {
  return query.apply(store.list());
}
