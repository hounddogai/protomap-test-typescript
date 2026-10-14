import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyProofReview } from "./legacy-proof-review.js";

/** Keeps legacy proof reviews by code. */
export interface LegacyProofReviewStore {
  find(code: string): LegacyProofReview | undefined;
  save(item: LegacyProofReview): void;
  remove(code: string): boolean;
  list(): LegacyProofReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyProofReviewStore implements LegacyProofReviewStore {
  items: Map<string, LegacyProofReview>;
  order: string[];

  constructor(items: Map<string, LegacyProofReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyProofReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyProofReview): void {
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

  list(): LegacyProofReview[] {
    const out: LegacyProofReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyProofReviewStore(): LegacyProofReviewStore {
  return new MemoryLegacyProofReviewStore(new Map<string, LegacyProofReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyProofReviewStore implements LegacyProofReviewStore {
  inner: LegacyProofReviewStore;
  cache: cache.TtlCache<LegacyProofReview>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyProofReviewStore,
    cacheValue: cache.TtlCache<LegacyProofReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyProofReview | undefined {
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

  save(item: LegacyProofReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyProofReview[] {
    return this.inner.list();
  }
}

export function newCachedLegacyProofReviewStore(inner: LegacyProofReviewStore, ttl: number, clockValue: clock.Clock): LegacyProofReviewStore {
  return new CachedLegacyProofReviewStore(inner, cache.newTtlCache<LegacyProofReview>(64, ttl, clockValue), 0, 0);
}

/** Selects legacy proof reviews. Empty fields match all. */
export class LegacyProofReviewQuery {
  channel: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMaximum: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyProofReview): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyProofReview[]): LegacyProofReview[] {
    const matched = collections.filter(items, (candidate: LegacyProofReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyProofReviews(store: LegacyProofReviewStore, query: LegacyProofReviewQuery): LegacyProofReview[] {
  return query.apply(store.list());
}
