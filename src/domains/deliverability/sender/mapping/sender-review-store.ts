import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderReview } from "./sender-review.js";

/** Keeps sender reviews by code. */
export interface SenderReviewStore {
  find(code: string): SenderReview | undefined;
  save(item: SenderReview): void;
  remove(code: string): boolean;
  list(): SenderReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderReviewStore implements SenderReviewStore {
  items: Map<string, SenderReview>;
  order: string[];

  constructor(items: Map<string, SenderReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderReview): void {
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

  list(): SenderReview[] {
    const out: SenderReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderReviewStore(): SenderReviewStore {
  return new MemorySenderReviewStore(new Map<string, SenderReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderReviewStore implements SenderReviewStore {
  inner: SenderReviewStore;
  cache: cache.TtlCache<SenderReview>;
  hits: number;
  misses: number;

  constructor(inner: SenderReviewStore, cacheValue: cache.TtlCache<SenderReview>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderReview | undefined {
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

  save(item: SenderReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderReview[] {
    return this.inner.list();
  }
}

export function newCachedSenderReviewStore(inner: SenderReviewStore, ttl: number, clockValue: clock.Clock): SenderReviewStore {
  return new CachedSenderReviewStore(inner, cache.newTtlCache<SenderReview>(128, ttl, clockValue), 0, 0);
}

/** Selects sender reviews. Empty fields match all. */
export class SenderReviewQuery {
  name: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDiscount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SenderReview): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderReview[]): SenderReview[] {
    const matched = collections.filter(items, (candidate: SenderReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderReviews(store: SenderReviewStore, query: SenderReviewQuery): SenderReview[] {
  return query.apply(store.list());
}
