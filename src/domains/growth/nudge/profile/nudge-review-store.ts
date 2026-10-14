import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { NudgeReview } from "./nudge-review.js";

/** Keeps nudge reviews by code. */
export interface NudgeReviewStore {
  find(code: string): NudgeReview | undefined;
  save(item: NudgeReview): void;
  remove(code: string): boolean;
  list(): NudgeReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryNudgeReviewStore implements NudgeReviewStore {
  items: Map<string, NudgeReview>;
  order: string[];

  constructor(items: Map<string, NudgeReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): NudgeReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: NudgeReview): void {
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

  list(): NudgeReview[] {
    const out: NudgeReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryNudgeReviewStore(): NudgeReviewStore {
  return new MemoryNudgeReviewStore(new Map<string, NudgeReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedNudgeReviewStore implements NudgeReviewStore {
  inner: NudgeReviewStore;
  cache: cache.TtlCache<NudgeReview>;
  hits: number;
  misses: number;

  constructor(inner: NudgeReviewStore, cacheValue: cache.TtlCache<NudgeReview>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): NudgeReview | undefined {
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

  save(item: NudgeReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): NudgeReview[] {
    return this.inner.list();
  }
}

export function newCachedNudgeReviewStore(inner: NudgeReviewStore, ttl: number, clockValue: clock.Clock): NudgeReviewStore {
  return new CachedNudgeReviewStore(inner, cache.newTtlCache<NudgeReview>(512, ttl, clockValue), 0, 0);
}

/** Selects nudge reviews. Empty fields match all. */
export class NudgeReviewQuery {
  channel: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minLimit: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: NudgeReview): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: NudgeReview[]): NudgeReview[] {
    const matched = collections.filter(items, (candidate: NudgeReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findNudgeReviews(store: NudgeReviewStore, query: NudgeReviewQuery): NudgeReview[] {
  return query.apply(store.list());
}
