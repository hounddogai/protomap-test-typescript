import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LevelReview } from "./level-review.js";

/** Keeps level reviews by code. */
export interface LevelReviewStore {
  find(code: string): LevelReview | undefined;
  save(item: LevelReview): void;
  remove(code: string): boolean;
  list(): LevelReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLevelReviewStore implements LevelReviewStore {
  items: Map<string, LevelReview>;
  order: string[];

  constructor(items: Map<string, LevelReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LevelReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LevelReview): void {
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

  list(): LevelReview[] {
    const out: LevelReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLevelReviewStore(): LevelReviewStore {
  return new MemoryLevelReviewStore(new Map<string, LevelReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLevelReviewStore implements LevelReviewStore {
  inner: LevelReviewStore;
  cache: cache.TtlCache<LevelReview>;
  hits: number;
  misses: number;

  constructor(inner: LevelReviewStore, cacheValue: cache.TtlCache<LevelReview>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LevelReview | undefined {
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

  save(item: LevelReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LevelReview[] {
    return this.inner.list();
  }
}

export function newCachedLevelReviewStore(inner: LevelReviewStore, ttl: number, clockValue: clock.Clock): LevelReviewStore {
  return new CachedLevelReviewStore(inner, cache.newTtlCache<LevelReview>(512, ttl, clockValue), 0, 0);
}

/** Selects level reviews. Empty fields match all. */
export class LevelReviewQuery {
  label: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minScore: number, statuses: string[], limit: number) {
    this.label = label;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LevelReview): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LevelReview[]): LevelReview[] {
    const matched = collections.filter(items, (candidate: LevelReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLevelReviews(store: LevelReviewStore, query: LevelReviewQuery): LevelReview[] {
  return query.apply(store.list());
}
