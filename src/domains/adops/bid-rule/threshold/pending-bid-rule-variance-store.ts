import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingBidRuleVariance } from "./pending-bid-rule-variance.js";

/** Keeps pending bid rule variances by code. */
export interface PendingBidRuleVarianceStore {
  find(code: string): PendingBidRuleVariance | undefined;
  save(item: PendingBidRuleVariance): void;
  remove(code: string): boolean;
  list(): PendingBidRuleVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingBidRuleVarianceStore implements PendingBidRuleVarianceStore {
  items: Map<string, PendingBidRuleVariance>;
  order: string[];

  constructor(items: Map<string, PendingBidRuleVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingBidRuleVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingBidRuleVariance): void {
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

  list(): PendingBidRuleVariance[] {
    const out: PendingBidRuleVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingBidRuleVarianceStore(): PendingBidRuleVarianceStore {
  return new MemoryPendingBidRuleVarianceStore(new Map<string, PendingBidRuleVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingBidRuleVarianceStore implements PendingBidRuleVarianceStore {
  inner: PendingBidRuleVarianceStore;
  cache: cache.TtlCache<PendingBidRuleVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingBidRuleVarianceStore,
    cacheValue: cache.TtlCache<PendingBidRuleVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingBidRuleVariance | undefined {
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

  save(item: PendingBidRuleVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingBidRuleVariance[] {
    return this.inner.list();
  }
}

export function newCachedPendingBidRuleVarianceStore(inner: PendingBidRuleVarianceStore, ttl: number, clockValue: clock.Clock): PendingBidRuleVarianceStore {
  return new CachedPendingBidRuleVarianceStore(
    inner,
    cache.newTtlCache<PendingBidRuleVariance>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending bid rule variances. Empty fields match all. */
export class PendingBidRuleVarianceQuery {
  title: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRatio: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingBidRuleVariance): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingBidRuleVariance[]): PendingBidRuleVariance[] {
    const matched = collections.filter(items, (candidate: PendingBidRuleVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingBidRuleVariances(store: PendingBidRuleVarianceStore, query: PendingBidRuleVarianceQuery): PendingBidRuleVariance[] {
  return query.apply(store.list());
}
