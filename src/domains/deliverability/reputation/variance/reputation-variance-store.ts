import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationVariance } from "./reputation-variance.js";

/** Keeps reputation variances by code. */
export interface ReputationVarianceStore {
  find(code: string): ReputationVariance | undefined;
  save(item: ReputationVariance): void;
  remove(code: string): boolean;
  list(): ReputationVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationVarianceStore implements ReputationVarianceStore {
  items: Map<string, ReputationVariance>;
  order: string[];

  constructor(items: Map<string, ReputationVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationVariance): void {
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

  list(): ReputationVariance[] {
    const out: ReputationVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationVarianceStore(): ReputationVarianceStore {
  return new MemoryReputationVarianceStore(new Map<string, ReputationVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationVarianceStore implements ReputationVarianceStore {
  inner: ReputationVarianceStore;
  cache: cache.TtlCache<ReputationVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationVarianceStore,
    cacheValue: cache.TtlCache<ReputationVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationVariance | undefined {
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

  save(item: ReputationVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationVariance[] {
    return this.inner.list();
  }
}

export function newCachedReputationVarianceStore(inner: ReputationVarianceStore, ttl: number, clockValue: clock.Clock): ReputationVarianceStore {
  return new CachedReputationVarianceStore(inner, cache.newTtlCache<ReputationVariance>(128, ttl, clockValue), 0, 0);
}

/** Selects reputation variances. Empty fields match all. */
export class ReputationVarianceQuery {
  locale: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAttempts: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationVariance): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationVariance[]): ReputationVariance[] {
    const matched = collections.filter(items, (candidate: ReputationVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationVariances(store: ReputationVarianceStore, query: ReputationVarianceQuery): ReputationVariance[] {
  return query.apply(store.list());
}
