import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StepReview } from "./step-review.js";

/** Keeps step reviews by code. */
export interface StepReviewStore {
  find(code: string): StepReview | undefined;
  save(item: StepReview): void;
  remove(code: string): boolean;
  list(): StepReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStepReviewStore implements StepReviewStore {
  items: Map<string, StepReview>;
  order: string[];

  constructor(items: Map<string, StepReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StepReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StepReview): void {
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

  list(): StepReview[] {
    const out: StepReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStepReviewStore(): StepReviewStore {
  return new MemoryStepReviewStore(new Map<string, StepReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStepReviewStore implements StepReviewStore {
  inner: StepReviewStore;
  cache: cache.TtlCache<StepReview>;
  hits: number;
  misses: number;

  constructor(inner: StepReviewStore, cacheValue: cache.TtlCache<StepReview>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StepReview | undefined {
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

  save(item: StepReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StepReview[] {
    return this.inner.list();
  }
}

export function newCachedStepReviewStore(inner: StepReviewStore, ttl: number, clockValue: clock.Clock): StepReviewStore {
  return new CachedStepReviewStore(inner, cache.newTtlCache<StepReview>(256, ttl, clockValue), 0, 0);
}

/** Selects step reviews. Empty fields match all. */
export class StepReviewQuery {
  label: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minOpenRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StepReview): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StepReview[]): StepReview[] {
    const matched = collections.filter(items, (candidate: StepReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStepReviews(store: StepReviewStore, query: StepReviewQuery): StepReview[] {
  return query.apply(store.list());
}
