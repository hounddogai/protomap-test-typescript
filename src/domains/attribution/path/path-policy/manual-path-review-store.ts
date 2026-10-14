import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualPathReview } from "./manual-path-review.js";

/** Keeps manual path reviews by code. */
export interface ManualPathReviewStore {
  find(code: string): ManualPathReview | undefined;
  save(item: ManualPathReview): void;
  remove(code: string): boolean;
  list(): ManualPathReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualPathReviewStore implements ManualPathReviewStore {
  items: Map<string, ManualPathReview>;
  order: string[];

  constructor(items: Map<string, ManualPathReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualPathReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualPathReview): void {
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

  list(): ManualPathReview[] {
    const out: ManualPathReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualPathReviewStore(): ManualPathReviewStore {
  return new MemoryManualPathReviewStore(new Map<string, ManualPathReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualPathReviewStore implements ManualPathReviewStore {
  inner: ManualPathReviewStore;
  cache: cache.TtlCache<ManualPathReview>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualPathReviewStore,
    cacheValue: cache.TtlCache<ManualPathReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualPathReview | undefined {
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

  save(item: ManualPathReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualPathReview[] {
    return this.inner.list();
  }
}

export function newCachedManualPathReviewStore(inner: ManualPathReviewStore, ttl: number, clockValue: clock.Clock): ManualPathReviewStore {
  return new CachedManualPathReviewStore(inner, cache.newTtlCache<ManualPathReview>(1024, ttl, clockValue), 0, 0);
}

/** Selects manual path reviews. Empty fields match all. */
export class ManualPathReviewQuery {
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

  matches(item: ManualPathReview): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualPathReview[]): ManualPathReview[] {
    const matched = collections.filter(items, (candidate: ManualPathReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualPathReviews(store: ManualPathReviewStore, query: ManualPathReviewQuery): ManualPathReview[] {
  return query.apply(store.list());
}
