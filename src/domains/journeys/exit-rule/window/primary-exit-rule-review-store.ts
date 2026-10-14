import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryExitRuleReview } from "./primary-exit-rule-review.js";

/** Keeps primary exit rule reviews by code. */
export interface PrimaryExitRuleReviewStore {
  find(code: string): PrimaryExitRuleReview | undefined;
  save(item: PrimaryExitRuleReview): void;
  remove(code: string): boolean;
  list(): PrimaryExitRuleReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryExitRuleReviewStore implements PrimaryExitRuleReviewStore {
  items: Map<string, PrimaryExitRuleReview>;
  order: string[];

  constructor(items: Map<string, PrimaryExitRuleReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryExitRuleReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryExitRuleReview): void {
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

  list(): PrimaryExitRuleReview[] {
    const out: PrimaryExitRuleReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryExitRuleReviewStore(): PrimaryExitRuleReviewStore {
  return new MemoryPrimaryExitRuleReviewStore(new Map<string, PrimaryExitRuleReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryExitRuleReviewStore implements PrimaryExitRuleReviewStore {
  inner: PrimaryExitRuleReviewStore;
  cache: cache.TtlCache<PrimaryExitRuleReview>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryExitRuleReviewStore,
    cacheValue: cache.TtlCache<PrimaryExitRuleReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryExitRuleReview | undefined {
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

  save(item: PrimaryExitRuleReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryExitRuleReview[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryExitRuleReviewStore(inner: PrimaryExitRuleReviewStore, ttl: number, clockValue: clock.Clock): PrimaryExitRuleReviewStore {
  return new CachedPrimaryExitRuleReviewStore(
    inner,
    cache.newTtlCache<PrimaryExitRuleReview>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary exit rule reviews. Empty fields match all. */
export class PrimaryExitRuleReviewQuery {
  name: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCeiling: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryExitRuleReview): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryExitRuleReview[]): PrimaryExitRuleReview[] {
    const matched = collections.filter(items, (candidate: PrimaryExitRuleReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryExitRuleReviews(store: PrimaryExitRuleReviewStore, query: PrimaryExitRuleReviewQuery): PrimaryExitRuleReview[] {
  return query.apply(store.list());
}
