import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualPreferenceReview } from "./manual-preference-review.js";

/** Keeps manual preference reviews by code. */
export interface ManualPreferenceReviewStore {
  find(code: string): ManualPreferenceReview | undefined;
  save(item: ManualPreferenceReview): void;
  remove(code: string): boolean;
  list(): ManualPreferenceReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualPreferenceReviewStore implements ManualPreferenceReviewStore {
  items: Map<string, ManualPreferenceReview>;
  order: string[];

  constructor(items: Map<string, ManualPreferenceReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualPreferenceReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualPreferenceReview): void {
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

  list(): ManualPreferenceReview[] {
    const out: ManualPreferenceReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualPreferenceReviewStore(): ManualPreferenceReviewStore {
  return new MemoryManualPreferenceReviewStore(new Map<string, ManualPreferenceReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualPreferenceReviewStore implements ManualPreferenceReviewStore {
  inner: ManualPreferenceReviewStore;
  cache: cache.TtlCache<ManualPreferenceReview>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualPreferenceReviewStore,
    cacheValue: cache.TtlCache<ManualPreferenceReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualPreferenceReview | undefined {
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

  save(item: ManualPreferenceReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualPreferenceReview[] {
    return this.inner.list();
  }
}

export function newCachedManualPreferenceReviewStore(inner: ManualPreferenceReviewStore, ttl: number, clockValue: clock.Clock): ManualPreferenceReviewStore {
  return new CachedManualPreferenceReviewStore(
    inner,
    cache.newTtlCache<ManualPreferenceReview>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual preference reviews. Empty fields match all. */
export class ManualPreferenceReviewQuery {
  name: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMaximum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualPreferenceReview): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualPreferenceReview[]): ManualPreferenceReview[] {
    const matched = collections.filter(items, (candidate: ManualPreferenceReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualPreferenceReviews(store: ManualPreferenceReviewStore, query: ManualPreferenceReviewQuery): ManualPreferenceReview[] {
  return query.apply(store.list());
}
