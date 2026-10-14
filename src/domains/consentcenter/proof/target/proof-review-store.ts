import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofReview } from "./proof-review.js";

/** Keeps proof reviews by code. */
export interface ProofReviewStore {
  find(code: string): ProofReview | undefined;
  save(item: ProofReview): void;
  remove(code: string): boolean;
  list(): ProofReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofReviewStore implements ProofReviewStore {
  items: Map<string, ProofReview>;
  order: string[];

  constructor(items: Map<string, ProofReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofReview): void {
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

  list(): ProofReview[] {
    const out: ProofReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofReviewStore(): ProofReviewStore {
  return new MemoryProofReviewStore(new Map<string, ProofReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofReviewStore implements ProofReviewStore {
  inner: ProofReviewStore;
  cache: cache.TtlCache<ProofReview>;
  hits: number;
  misses: number;

  constructor(inner: ProofReviewStore, cacheValue: cache.TtlCache<ProofReview>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofReview | undefined {
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

  save(item: ProofReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofReview[] {
    return this.inner.list();
  }
}

export function newCachedProofReviewStore(inner: ProofReviewStore, ttl: number, clockValue: clock.Clock): ProofReviewStore {
  return new CachedProofReviewStore(inner, cache.newTtlCache<ProofReview>(128, ttl, clockValue), 0, 0);
}

/** Selects proof reviews. Empty fields match all. */
export class ProofReviewQuery {
  source: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.source = source;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofReview): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofReview[]): ProofReview[] {
    const matched = collections.filter(items, (candidate: ProofReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofReviews(store: ProofReviewStore, query: ProofReviewQuery): ProofReview[] {
  return query.apply(store.list());
}
