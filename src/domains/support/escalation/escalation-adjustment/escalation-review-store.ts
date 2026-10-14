import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationReview } from "./escalation-review.js";

/** Keeps escalation reviews by code. */
export interface EscalationReviewStore {
  find(code: string): EscalationReview | undefined;
  save(item: EscalationReview): void;
  remove(code: string): boolean;
  list(): EscalationReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationReviewStore implements EscalationReviewStore {
  items: Map<string, EscalationReview>;
  order: string[];

  constructor(items: Map<string, EscalationReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationReview): void {
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

  list(): EscalationReview[] {
    const out: EscalationReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationReviewStore(): EscalationReviewStore {
  return new MemoryEscalationReviewStore(new Map<string, EscalationReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationReviewStore implements EscalationReviewStore {
  inner: EscalationReviewStore;
  cache: cache.TtlCache<EscalationReview>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationReviewStore,
    cacheValue: cache.TtlCache<EscalationReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationReview | undefined {
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

  save(item: EscalationReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationReview[] {
    return this.inner.list();
  }
}

export function newCachedEscalationReviewStore(inner: EscalationReviewStore, ttl: number, clockValue: clock.Clock): EscalationReviewStore {
  return new CachedEscalationReviewStore(inner, cache.newTtlCache<EscalationReview>(512, ttl, clockValue), 0, 0);
}

/** Selects escalation reviews. Empty fields match all. */
export class EscalationReviewQuery {
  country: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minSequence: number, statuses: string[], limit: number) {
    this.country = country;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationReview): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationReview[]): EscalationReview[] {
    const matched = collections.filter(items, (candidate: EscalationReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationReviews(store: EscalationReviewStore, query: EscalationReviewQuery): EscalationReview[] {
  return query.apply(store.list());
}
