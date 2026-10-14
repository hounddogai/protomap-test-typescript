import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultWarmupReview } from "./default-warmup-review.js";

/** Keeps default warmup reviews by code. */
export interface DefaultWarmupReviewStore {
  find(code: string): DefaultWarmupReview | undefined;
  save(item: DefaultWarmupReview): void;
  remove(code: string): boolean;
  list(): DefaultWarmupReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultWarmupReviewStore implements DefaultWarmupReviewStore {
  items: Map<string, DefaultWarmupReview>;
  order: string[];

  constructor(items: Map<string, DefaultWarmupReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultWarmupReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultWarmupReview): void {
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

  list(): DefaultWarmupReview[] {
    const out: DefaultWarmupReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultWarmupReviewStore(): DefaultWarmupReviewStore {
  return new MemoryDefaultWarmupReviewStore(new Map<string, DefaultWarmupReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultWarmupReviewStore implements DefaultWarmupReviewStore {
  inner: DefaultWarmupReviewStore;
  cache: cache.TtlCache<DefaultWarmupReview>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultWarmupReviewStore,
    cacheValue: cache.TtlCache<DefaultWarmupReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultWarmupReview | undefined {
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

  save(item: DefaultWarmupReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultWarmupReview[] {
    return this.inner.list();
  }
}

export function newCachedDefaultWarmupReviewStore(inner: DefaultWarmupReviewStore, ttl: number, clockValue: clock.Clock): DefaultWarmupReviewStore {
  return new CachedDefaultWarmupReviewStore(inner, cache.newTtlCache<DefaultWarmupReview>(256, ttl, clockValue), 0, 0);
}

/** Selects default warmup reviews. Empty fields match all. */
export class DefaultWarmupReviewQuery {
  label: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultWarmupReview): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultWarmupReview[]): DefaultWarmupReview[] {
    const matched = collections.filter(items, (candidate: DefaultWarmupReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultWarmupReviews(store: DefaultWarmupReviewStore, query: DefaultWarmupReviewQuery): DefaultWarmupReview[] {
  return query.apply(store.list());
}
