import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeReview } from "./challenge-review.js";

/** Keeps challenge reviews by code. */
export interface ChallengeReviewStore {
  find(code: string): ChallengeReview | undefined;
  save(item: ChallengeReview): void;
  remove(code: string): boolean;
  list(): ChallengeReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeReviewStore implements ChallengeReviewStore {
  items: Map<string, ChallengeReview>;
  order: string[];

  constructor(items: Map<string, ChallengeReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeReview): void {
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

  list(): ChallengeReview[] {
    const out: ChallengeReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeReviewStore(): ChallengeReviewStore {
  return new MemoryChallengeReviewStore(new Map<string, ChallengeReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeReviewStore implements ChallengeReviewStore {
  inner: ChallengeReviewStore;
  cache: cache.TtlCache<ChallengeReview>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeReviewStore,
    cacheValue: cache.TtlCache<ChallengeReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeReview | undefined {
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

  save(item: ChallengeReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeReview[] {
    return this.inner.list();
  }
}

export function newCachedChallengeReviewStore(inner: ChallengeReviewStore, ttl: number, clockValue: clock.Clock): ChallengeReviewStore {
  return new CachedChallengeReviewStore(inner, cache.newTtlCache<ChallengeReview>(64, ttl, clockValue), 0, 0);
}

/** Selects challenge reviews. Empty fields match all. */
export class ChallengeReviewQuery {
  region: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minVersion: number, statuses: string[], limit: number) {
    this.region = region;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeReview): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeReview[]): ChallengeReview[] {
    const matched = collections.filter(items, (candidate: ChallengeReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeReviews(store: ChallengeReviewStore, query: ChallengeReviewQuery): ChallengeReview[] {
  return query.apply(store.list());
}
