import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingExitRuleReview } from "./rolling-exit-rule-review.js";

/** Keeps rolling exit rule reviews by code. */
export interface RollingExitRuleReviewStore {
  find(code: string): RollingExitRuleReview | undefined;
  save(item: RollingExitRuleReview): void;
  remove(code: string): boolean;
  list(): RollingExitRuleReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingExitRuleReviewStore implements RollingExitRuleReviewStore {
  items: Map<string, RollingExitRuleReview>;
  order: string[];

  constructor(items: Map<string, RollingExitRuleReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingExitRuleReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingExitRuleReview): void {
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

  list(): RollingExitRuleReview[] {
    const out: RollingExitRuleReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingExitRuleReviewStore(): RollingExitRuleReviewStore {
  return new MemoryRollingExitRuleReviewStore(new Map<string, RollingExitRuleReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingExitRuleReviewStore implements RollingExitRuleReviewStore {
  inner: RollingExitRuleReviewStore;
  cache: cache.TtlCache<RollingExitRuleReview>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingExitRuleReviewStore,
    cacheValue: cache.TtlCache<RollingExitRuleReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingExitRuleReview | undefined {
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

  save(item: RollingExitRuleReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingExitRuleReview[] {
    return this.inner.list();
  }
}

export function newCachedRollingExitRuleReviewStore(inner: RollingExitRuleReviewStore, ttl: number, clockValue: clock.Clock): RollingExitRuleReviewStore {
  return new CachedRollingExitRuleReviewStore(
    inner,
    cache.newTtlCache<RollingExitRuleReview>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling exit rule reviews. Empty fields match all. */
export class RollingExitRuleReviewQuery {
  label: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCost: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingExitRuleReview): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingExitRuleReview[]): RollingExitRuleReview[] {
    const matched = collections.filter(items, (candidate: RollingExitRuleReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingExitRuleReviews(store: RollingExitRuleReviewStore, query: RollingExitRuleReviewQuery): RollingExitRuleReview[] {
  return query.apply(store.list());
}
