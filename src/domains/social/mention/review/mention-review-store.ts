import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionReview } from "./mention-review.js";

/** Keeps mention reviews by code. */
export interface MentionReviewStore {
  find(code: string): MentionReview | undefined;
  save(item: MentionReview): void;
  remove(code: string): boolean;
  list(): MentionReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionReviewStore implements MentionReviewStore {
  items: Map<string, MentionReview>;
  order: string[];

  constructor(items: Map<string, MentionReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionReview): void {
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

  list(): MentionReview[] {
    const out: MentionReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionReviewStore(): MentionReviewStore {
  return new MemoryMentionReviewStore(new Map<string, MentionReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionReviewStore implements MentionReviewStore {
  inner: MentionReviewStore;
  cache: cache.TtlCache<MentionReview>;
  hits: number;
  misses: number;

  constructor(inner: MentionReviewStore, cacheValue: cache.TtlCache<MentionReview>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionReview | undefined {
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

  save(item: MentionReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionReview[] {
    return this.inner.list();
  }
}

export function newCachedMentionReviewStore(inner: MentionReviewStore, ttl: number, clockValue: clock.Clock): MentionReviewStore {
  return new CachedMentionReviewStore(inner, cache.newTtlCache<MentionReview>(1024, ttl, clockValue), 0, 0);
}

/** Selects mention reviews. Empty fields match all. */
export class MentionReviewQuery {
  category: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRetries: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionReview): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionReview[]): MentionReview[] {
    const matched = collections.filter(items, (candidate: MentionReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionReviews(store: MentionReviewStore, query: MentionReviewQuery): MentionReview[] {
  return query.apply(store.list());
}
