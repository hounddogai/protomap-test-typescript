import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualSlaReview } from "./manual-sla-review.js";

/** Keeps manual sla reviews by code. */
export interface ManualSlaReviewStore {
  find(code: string): ManualSlaReview | undefined;
  save(item: ManualSlaReview): void;
  remove(code: string): boolean;
  list(): ManualSlaReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualSlaReviewStore implements ManualSlaReviewStore {
  items: Map<string, ManualSlaReview>;
  order: string[];

  constructor(items: Map<string, ManualSlaReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualSlaReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualSlaReview): void {
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

  list(): ManualSlaReview[] {
    const out: ManualSlaReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualSlaReviewStore(): ManualSlaReviewStore {
  return new MemoryManualSlaReviewStore(new Map<string, ManualSlaReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualSlaReviewStore implements ManualSlaReviewStore {
  inner: ManualSlaReviewStore;
  cache: cache.TtlCache<ManualSlaReview>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualSlaReviewStore,
    cacheValue: cache.TtlCache<ManualSlaReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualSlaReview | undefined {
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

  save(item: ManualSlaReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualSlaReview[] {
    return this.inner.list();
  }
}

export function newCachedManualSlaReviewStore(inner: ManualSlaReviewStore, ttl: number, clockValue: clock.Clock): ManualSlaReviewStore {
  return new CachedManualSlaReviewStore(inner, cache.newTtlCache<ManualSlaReview>(512, ttl, clockValue), 0, 0);
}

/** Selects manual sla reviews. Empty fields match all. */
export class ManualSlaReviewQuery {
  source: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minFloorValue: number, statuses: string[], limit: number) {
    this.source = source;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualSlaReview): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualSlaReview[]): ManualSlaReview[] {
    const matched = collections.filter(items, (candidate: ManualSlaReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualSlaReviews(store: ManualSlaReviewStore, query: ManualSlaReviewQuery): ManualSlaReview[] {
  return query.apply(store.list());
}
