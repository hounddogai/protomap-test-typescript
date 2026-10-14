import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualEscalationReview } from "./manual-escalation-review.js";

/** Keeps manual escalation reviews by code. */
export interface ManualEscalationReviewStore {
  find(code: string): ManualEscalationReview | undefined;
  save(item: ManualEscalationReview): void;
  remove(code: string): boolean;
  list(): ManualEscalationReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualEscalationReviewStore implements ManualEscalationReviewStore {
  items: Map<string, ManualEscalationReview>;
  order: string[];

  constructor(items: Map<string, ManualEscalationReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualEscalationReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualEscalationReview): void {
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

  list(): ManualEscalationReview[] {
    const out: ManualEscalationReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualEscalationReviewStore(): ManualEscalationReviewStore {
  return new MemoryManualEscalationReviewStore(new Map<string, ManualEscalationReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualEscalationReviewStore implements ManualEscalationReviewStore {
  inner: ManualEscalationReviewStore;
  cache: cache.TtlCache<ManualEscalationReview>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualEscalationReviewStore,
    cacheValue: cache.TtlCache<ManualEscalationReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualEscalationReview | undefined {
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

  save(item: ManualEscalationReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualEscalationReview[] {
    return this.inner.list();
  }
}

export function newCachedManualEscalationReviewStore(inner: ManualEscalationReviewStore, ttl: number, clockValue: clock.Clock): ManualEscalationReviewStore {
  return new CachedManualEscalationReviewStore(
    inner,
    cache.newTtlCache<ManualEscalationReview>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual escalation reviews. Empty fields match all. */
export class ManualEscalationReviewQuery {
  country: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minSendAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualEscalationReview): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualEscalationReview[]): ManualEscalationReview[] {
    const matched = collections.filter(items, (candidate: ManualEscalationReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualEscalationReviews(store: ManualEscalationReviewStore, query: ManualEscalationReviewQuery): ManualEscalationReview[] {
  return query.apply(store.list());
}
