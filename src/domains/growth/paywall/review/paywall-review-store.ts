import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallReview } from "./paywall-review.js";

/** Keeps paywall reviews by code. */
export interface PaywallReviewStore {
  find(code: string): PaywallReview | undefined;
  save(item: PaywallReview): void;
  remove(code: string): boolean;
  list(): PaywallReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallReviewStore implements PaywallReviewStore {
  items: Map<string, PaywallReview>;
  order: string[];

  constructor(items: Map<string, PaywallReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallReview): void {
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

  list(): PaywallReview[] {
    const out: PaywallReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallReviewStore(): PaywallReviewStore {
  return new MemoryPaywallReviewStore(new Map<string, PaywallReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallReviewStore implements PaywallReviewStore {
  inner: PaywallReviewStore;
  cache: cache.TtlCache<PaywallReview>;
  hits: number;
  misses: number;

  constructor(inner: PaywallReviewStore, cacheValue: cache.TtlCache<PaywallReview>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallReview | undefined {
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

  save(item: PaywallReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallReview[] {
    return this.inner.list();
  }
}

export function newCachedPaywallReviewStore(inner: PaywallReviewStore, ttl: number, clockValue: clock.Clock): PaywallReviewStore {
  return new CachedPaywallReviewStore(inner, cache.newTtlCache<PaywallReview>(128, ttl, clockValue), 0, 0);
}

/** Selects paywall reviews. Empty fields match all. */
export class PaywallReviewQuery {
  channel: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minPriority: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallReview): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallReview[]): PaywallReview[] {
    const matched = collections.filter(items, (candidate: PaywallReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallReviews(store: PaywallReviewStore, query: PaywallReviewQuery): PaywallReview[] {
  return query.apply(store.list());
}
