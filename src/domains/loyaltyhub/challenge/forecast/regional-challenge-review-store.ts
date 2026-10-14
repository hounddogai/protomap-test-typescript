import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalChallengeReview } from "./regional-challenge-review.js";

/** Keeps regional challenge reviews by code. */
export interface RegionalChallengeReviewStore {
  find(code: string): RegionalChallengeReview | undefined;
  save(item: RegionalChallengeReview): void;
  remove(code: string): boolean;
  list(): RegionalChallengeReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalChallengeReviewStore implements RegionalChallengeReviewStore {
  items: Map<string, RegionalChallengeReview>;
  order: string[];

  constructor(items: Map<string, RegionalChallengeReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalChallengeReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalChallengeReview): void {
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

  list(): RegionalChallengeReview[] {
    const out: RegionalChallengeReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalChallengeReviewStore(): RegionalChallengeReviewStore {
  return new MemoryRegionalChallengeReviewStore(new Map<string, RegionalChallengeReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalChallengeReviewStore implements RegionalChallengeReviewStore {
  inner: RegionalChallengeReviewStore;
  cache: cache.TtlCache<RegionalChallengeReview>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalChallengeReviewStore,
    cacheValue: cache.TtlCache<RegionalChallengeReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalChallengeReview | undefined {
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

  save(item: RegionalChallengeReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalChallengeReview[] {
    return this.inner.list();
  }
}

export function newCachedRegionalChallengeReviewStore(inner: RegionalChallengeReviewStore, ttl: number, clockValue: clock.Clock): RegionalChallengeReviewStore {
  return new CachedRegionalChallengeReviewStore(
    inner,
    cache.newTtlCache<RegionalChallengeReview>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional challenge reviews. Empty fields match all. */
export class RegionalChallengeReviewQuery {
  title: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRevision: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalChallengeReview): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalChallengeReview[]): RegionalChallengeReview[] {
    const matched = collections.filter(items, (candidate: RegionalChallengeReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalChallengeReviews(store: RegionalChallengeReviewStore, query: RegionalChallengeReviewQuery): RegionalChallengeReview[] {
  return query.apply(store.list());
}
