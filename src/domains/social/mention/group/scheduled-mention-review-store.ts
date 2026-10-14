import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledMentionReview } from "./scheduled-mention-review.js";

/** Keeps scheduled mention reviews by code. */
export interface ScheduledMentionReviewStore {
  find(code: string): ScheduledMentionReview | undefined;
  save(item: ScheduledMentionReview): void;
  remove(code: string): boolean;
  list(): ScheduledMentionReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledMentionReviewStore implements ScheduledMentionReviewStore {
  items: Map<string, ScheduledMentionReview>;
  order: string[];

  constructor(items: Map<string, ScheduledMentionReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledMentionReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledMentionReview): void {
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

  list(): ScheduledMentionReview[] {
    const out: ScheduledMentionReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledMentionReviewStore(): ScheduledMentionReviewStore {
  return new MemoryScheduledMentionReviewStore(new Map<string, ScheduledMentionReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledMentionReviewStore implements ScheduledMentionReviewStore {
  inner: ScheduledMentionReviewStore;
  cache: cache.TtlCache<ScheduledMentionReview>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledMentionReviewStore,
    cacheValue: cache.TtlCache<ScheduledMentionReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledMentionReview | undefined {
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

  save(item: ScheduledMentionReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledMentionReview[] {
    return this.inner.list();
  }
}

export function newCachedScheduledMentionReviewStore(inner: ScheduledMentionReviewStore, ttl: number, clockValue: clock.Clock): ScheduledMentionReviewStore {
  return new CachedScheduledMentionReviewStore(
    inner,
    cache.newTtlCache<ScheduledMentionReview>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled mention reviews. Empty fields match all. */
export class ScheduledMentionReviewQuery {
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

  matches(item: ScheduledMentionReview): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledMentionReview[]): ScheduledMentionReview[] {
    const matched = collections.filter(items, (candidate: ScheduledMentionReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledMentionReviews(store: ScheduledMentionReviewStore, query: ScheduledMentionReviewQuery): ScheduledMentionReview[] {
  return query.apply(store.list());
}
