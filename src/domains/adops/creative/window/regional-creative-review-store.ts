import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalCreativeReview } from "./regional-creative-review.js";

/** Keeps regional creative reviews by code. */
export interface RegionalCreativeReviewStore {
  find(code: string): RegionalCreativeReview | undefined;
  save(item: RegionalCreativeReview): void;
  remove(code: string): boolean;
  list(): RegionalCreativeReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalCreativeReviewStore implements RegionalCreativeReviewStore {
  items: Map<string, RegionalCreativeReview>;
  order: string[];

  constructor(items: Map<string, RegionalCreativeReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalCreativeReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalCreativeReview): void {
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

  list(): RegionalCreativeReview[] {
    const out: RegionalCreativeReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalCreativeReviewStore(): RegionalCreativeReviewStore {
  return new MemoryRegionalCreativeReviewStore(new Map<string, RegionalCreativeReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalCreativeReviewStore implements RegionalCreativeReviewStore {
  inner: RegionalCreativeReviewStore;
  cache: cache.TtlCache<RegionalCreativeReview>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalCreativeReviewStore,
    cacheValue: cache.TtlCache<RegionalCreativeReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalCreativeReview | undefined {
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

  save(item: RegionalCreativeReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalCreativeReview[] {
    return this.inner.list();
  }
}

export function newCachedRegionalCreativeReviewStore(inner: RegionalCreativeReviewStore, ttl: number, clockValue: clock.Clock): RegionalCreativeReviewStore {
  return new CachedRegionalCreativeReviewStore(
    inner,
    cache.newTtlCache<RegionalCreativeReview>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional creative reviews. Empty fields match all. */
export class RegionalCreativeReviewQuery {
  title: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minLimit: number, statuses: string[], limit: number) {
    this.title = title;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalCreativeReview): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalCreativeReview[]): RegionalCreativeReview[] {
    const matched = collections.filter(items, (candidate: RegionalCreativeReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalCreativeReviews(store: RegionalCreativeReviewStore, query: RegionalCreativeReviewQuery): RegionalCreativeReview[] {
  return query.apply(store.list());
}
