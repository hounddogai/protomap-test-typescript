import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MacroReview } from "./macro-review.js";

/** Keeps macro reviews by code. */
export interface MacroReviewStore {
  find(code: string): MacroReview | undefined;
  save(item: MacroReview): void;
  remove(code: string): boolean;
  list(): MacroReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMacroReviewStore implements MacroReviewStore {
  items: Map<string, MacroReview>;
  order: string[];

  constructor(items: Map<string, MacroReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MacroReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MacroReview): void {
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

  list(): MacroReview[] {
    const out: MacroReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMacroReviewStore(): MacroReviewStore {
  return new MemoryMacroReviewStore(new Map<string, MacroReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMacroReviewStore implements MacroReviewStore {
  inner: MacroReviewStore;
  cache: cache.TtlCache<MacroReview>;
  hits: number;
  misses: number;

  constructor(inner: MacroReviewStore, cacheValue: cache.TtlCache<MacroReview>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MacroReview | undefined {
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

  save(item: MacroReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MacroReview[] {
    return this.inner.list();
  }
}

export function newCachedMacroReviewStore(inner: MacroReviewStore, ttl: number, clockValue: clock.Clock): MacroReviewStore {
  return new CachedMacroReviewStore(inner, cache.newTtlCache<MacroReview>(1024, ttl, clockValue), 0, 0);
}

/** Selects macro reviews. Empty fields match all. */
export class MacroReviewQuery {
  country: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minThreshold: number, statuses: string[], limit: number) {
    this.country = country;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MacroReview): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MacroReview[]): MacroReview[] {
    const matched = collections.filter(items, (candidate: MacroReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMacroReviews(store: MacroReviewStore, query: MacroReviewQuery): MacroReview[] {
  return query.apply(store.list());
}
