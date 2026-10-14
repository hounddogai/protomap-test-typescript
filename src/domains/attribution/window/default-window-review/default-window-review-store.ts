import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultWindowReview } from "./default-window-review.js";

/** Keeps default window reviews by code. */
export interface DefaultWindowReviewStore {
  find(code: string): DefaultWindowReview | undefined;
  save(item: DefaultWindowReview): void;
  remove(code: string): boolean;
  list(): DefaultWindowReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultWindowReviewStore implements DefaultWindowReviewStore {
  items: Map<string, DefaultWindowReview>;
  order: string[];

  constructor(items: Map<string, DefaultWindowReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultWindowReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultWindowReview): void {
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

  list(): DefaultWindowReview[] {
    const out: DefaultWindowReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultWindowReviewStore(): DefaultWindowReviewStore {
  return new MemoryDefaultWindowReviewStore(new Map<string, DefaultWindowReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultWindowReviewStore implements DefaultWindowReviewStore {
  inner: DefaultWindowReviewStore;
  cache: cache.TtlCache<DefaultWindowReview>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultWindowReviewStore,
    cacheValue: cache.TtlCache<DefaultWindowReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultWindowReview | undefined {
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

  save(item: DefaultWindowReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultWindowReview[] {
    return this.inner.list();
  }
}

export function newCachedDefaultWindowReviewStore(inner: DefaultWindowReviewStore, ttl: number, clockValue: clock.Clock): DefaultWindowReviewStore {
  return new CachedDefaultWindowReviewStore(inner, cache.newTtlCache<DefaultWindowReview>(128, ttl, clockValue), 0, 0);
}

/** Selects default window reviews. Empty fields match all. */
export class DefaultWindowReviewQuery {
  locale: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minDiscount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultWindowReview): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultWindowReview[]): DefaultWindowReview[] {
    const matched = collections.filter(items, (candidate: DefaultWindowReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultWindowReviews(store: DefaultWindowReviewStore, query: DefaultWindowReviewQuery): DefaultWindowReview[] {
  return query.apply(store.list());
}
