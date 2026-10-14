import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingCohortVariance } from "./pending-cohort-variance.js";

/** Keeps pending cohort variances by code. */
export interface PendingCohortVarianceStore {
  find(code: string): PendingCohortVariance | undefined;
  save(item: PendingCohortVariance): void;
  remove(code: string): boolean;
  list(): PendingCohortVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingCohortVarianceStore implements PendingCohortVarianceStore {
  items: Map<string, PendingCohortVariance>;
  order: string[];

  constructor(items: Map<string, PendingCohortVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingCohortVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingCohortVariance): void {
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

  list(): PendingCohortVariance[] {
    const out: PendingCohortVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingCohortVarianceStore(): PendingCohortVarianceStore {
  return new MemoryPendingCohortVarianceStore(new Map<string, PendingCohortVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingCohortVarianceStore implements PendingCohortVarianceStore {
  inner: PendingCohortVarianceStore;
  cache: cache.TtlCache<PendingCohortVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingCohortVarianceStore,
    cacheValue: cache.TtlCache<PendingCohortVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingCohortVariance | undefined {
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

  save(item: PendingCohortVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingCohortVariance[] {
    return this.inner.list();
  }
}

export function newCachedPendingCohortVarianceStore(inner: PendingCohortVarianceStore, ttl: number, clockValue: clock.Clock): PendingCohortVarianceStore {
  return new CachedPendingCohortVarianceStore(
    inner,
    cache.newTtlCache<PendingCohortVariance>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending cohort variances. Empty fields match all. */
export class PendingCohortVarianceQuery {
  source: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minScore: number, statuses: string[], limit: number) {
    this.source = source;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingCohortVariance): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingCohortVariance[]): PendingCohortVariance[] {
    const matched = collections.filter(items, (candidate: PendingCohortVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingCohortVariances(store: PendingCohortVarianceStore, query: PendingCohortVarianceQuery): PendingCohortVariance[] {
  return query.apply(store.list());
}
