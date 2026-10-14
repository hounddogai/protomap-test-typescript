import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ComplaintReview } from "./complaint-review.js";

/** Keeps complaint reviews by code. */
export interface ComplaintReviewStore {
  find(code: string): ComplaintReview | undefined;
  save(item: ComplaintReview): void;
  remove(code: string): boolean;
  list(): ComplaintReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryComplaintReviewStore implements ComplaintReviewStore {
  items: Map<string, ComplaintReview>;
  order: string[];

  constructor(items: Map<string, ComplaintReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ComplaintReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ComplaintReview): void {
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

  list(): ComplaintReview[] {
    const out: ComplaintReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryComplaintReviewStore(): ComplaintReviewStore {
  return new MemoryComplaintReviewStore(new Map<string, ComplaintReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedComplaintReviewStore implements ComplaintReviewStore {
  inner: ComplaintReviewStore;
  cache: cache.TtlCache<ComplaintReview>;
  hits: number;
  misses: number;

  constructor(
    inner: ComplaintReviewStore,
    cacheValue: cache.TtlCache<ComplaintReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ComplaintReview | undefined {
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

  save(item: ComplaintReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ComplaintReview[] {
    return this.inner.list();
  }
}

export function newCachedComplaintReviewStore(inner: ComplaintReviewStore, ttl: number, clockValue: clock.Clock): ComplaintReviewStore {
  return new CachedComplaintReviewStore(inner, cache.newTtlCache<ComplaintReview>(64, ttl, clockValue), 0, 0);
}

/** Selects complaint reviews. Empty fields match all. */
export class ComplaintReviewQuery {
  label: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRevision: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ComplaintReview): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ComplaintReview[]): ComplaintReview[] {
    const matched = collections.filter(items, (candidate: ComplaintReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findComplaintReviews(store: ComplaintReviewStore, query: ComplaintReviewQuery): ComplaintReview[] {
  return query.apply(store.list());
}
