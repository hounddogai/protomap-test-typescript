import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceScore } from "./bounce-score.js";

/** Keeps bounce scores by code. */
export interface BounceScoreStore {
  find(code: string): BounceScore | undefined;
  save(item: BounceScore): void;
  remove(code: string): boolean;
  list(): BounceScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceScoreStore implements BounceScoreStore {
  items: Map<string, BounceScore>;
  order: string[];

  constructor(items: Map<string, BounceScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceScore): void {
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

  list(): BounceScore[] {
    const out: BounceScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceScoreStore(): BounceScoreStore {
  return new MemoryBounceScoreStore(new Map<string, BounceScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceScoreStore implements BounceScoreStore {
  inner: BounceScoreStore;
  cache: cache.TtlCache<BounceScore>;
  hits: number;
  misses: number;

  constructor(inner: BounceScoreStore, cacheValue: cache.TtlCache<BounceScore>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceScore | undefined {
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

  save(item: BounceScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceScore[] {
    return this.inner.list();
  }
}

export function newCachedBounceScoreStore(inner: BounceScoreStore, ttl: number, clockValue: clock.Clock): BounceScoreStore {
  return new CachedBounceScoreStore(inner, cache.newTtlCache<BounceScore>(1024, ttl, clockValue), 0, 0);
}

/** Selects bounce scores. Empty fields match all. */
export class BounceScoreQuery {
  locale: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAmount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceScore): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceScore[]): BounceScore[] {
    const matched = collections.filter(items, (candidate: BounceScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceScores(store: BounceScoreStore, query: BounceScoreQuery): BounceScore[] {
  return query.apply(store.list());
}
