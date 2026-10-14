import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientSlaReview } from "./lenient-sla-review.js";

/** Keeps lenient sla reviews by code. */
export interface LenientSlaReviewStore {
  find(code: string): LenientSlaReview | undefined;
  save(item: LenientSlaReview): void;
  remove(code: string): boolean;
  list(): LenientSlaReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientSlaReviewStore implements LenientSlaReviewStore {
  items: Map<string, LenientSlaReview>;
  order: string[];

  constructor(items: Map<string, LenientSlaReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientSlaReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientSlaReview): void {
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

  list(): LenientSlaReview[] {
    const out: LenientSlaReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientSlaReviewStore(): LenientSlaReviewStore {
  return new MemoryLenientSlaReviewStore(new Map<string, LenientSlaReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientSlaReviewStore implements LenientSlaReviewStore {
  inner: LenientSlaReviewStore;
  cache: cache.TtlCache<LenientSlaReview>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientSlaReviewStore,
    cacheValue: cache.TtlCache<LenientSlaReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientSlaReview | undefined {
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

  save(item: LenientSlaReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientSlaReview[] {
    return this.inner.list();
  }
}

export function newCachedLenientSlaReviewStore(inner: LenientSlaReviewStore, ttl: number, clockValue: clock.Clock): LenientSlaReviewStore {
  return new CachedLenientSlaReviewStore(inner, cache.newTtlCache<LenientSlaReview>(512, ttl, clockValue), 0, 0);
}

/** Selects lenient sla reviews. Empty fields match all. */
export class LenientSlaReviewQuery {
  source: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minVersion: number, statuses: string[], limit: number) {
    this.source = source;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientSlaReview): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientSlaReview[]): LenientSlaReview[] {
    const matched = collections.filter(items, (candidate: LenientSlaReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientSlaReviews(store: LenientSlaReviewStore, query: LenientSlaReviewQuery): LenientSlaReview[] {
  return query.apply(store.list());
}
