import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaReview } from "./sla-review.js";

/** Keeps sla reviews by code. */
export interface SlaReviewStore {
  find(code: string): SlaReview | undefined;
  save(item: SlaReview): void;
  remove(code: string): boolean;
  list(): SlaReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaReviewStore implements SlaReviewStore {
  items: Map<string, SlaReview>;
  order: string[];

  constructor(items: Map<string, SlaReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaReview): void {
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

  list(): SlaReview[] {
    const out: SlaReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaReviewStore(): SlaReviewStore {
  return new MemorySlaReviewStore(new Map<string, SlaReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaReviewStore implements SlaReviewStore {
  inner: SlaReviewStore;
  cache: cache.TtlCache<SlaReview>;
  hits: number;
  misses: number;

  constructor(inner: SlaReviewStore, cacheValue: cache.TtlCache<SlaReview>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaReview | undefined {
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

  save(item: SlaReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaReview[] {
    return this.inner.list();
  }
}

export function newCachedSlaReviewStore(inner: SlaReviewStore, ttl: number, clockValue: clock.Clock): SlaReviewStore {
  return new CachedSlaReviewStore(inner, cache.newTtlCache<SlaReview>(1024, ttl, clockValue), 0, 0);
}

/** Selects sla reviews. Empty fields match all. */
export class SlaReviewQuery {
  category: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRatio: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaReview): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaReview[]): SlaReview[] {
    const matched = collections.filter(items, (candidate: SlaReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaReviews(store: SlaReviewStore, query: SlaReviewQuery): SlaReview[] {
  return query.apply(store.list());
}
