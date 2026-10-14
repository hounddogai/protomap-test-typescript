import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacySuppressionVariance } from "./legacy-suppression-variance.js";

/** Keeps legacy suppression variances by code. */
export interface LegacySuppressionVarianceStore {
  find(code: string): LegacySuppressionVariance | undefined;
  save(item: LegacySuppressionVariance): void;
  remove(code: string): boolean;
  list(): LegacySuppressionVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacySuppressionVarianceStore implements LegacySuppressionVarianceStore {
  items: Map<string, LegacySuppressionVariance>;
  order: string[];

  constructor(items: Map<string, LegacySuppressionVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacySuppressionVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacySuppressionVariance): void {
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

  list(): LegacySuppressionVariance[] {
    const out: LegacySuppressionVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacySuppressionVarianceStore(): LegacySuppressionVarianceStore {
  return new MemoryLegacySuppressionVarianceStore(new Map<string, LegacySuppressionVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacySuppressionVarianceStore implements LegacySuppressionVarianceStore {
  inner: LegacySuppressionVarianceStore;
  cache: cache.TtlCache<LegacySuppressionVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacySuppressionVarianceStore,
    cacheValue: cache.TtlCache<LegacySuppressionVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacySuppressionVariance | undefined {
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

  save(item: LegacySuppressionVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacySuppressionVariance[] {
    return this.inner.list();
  }
}

export function newCachedLegacySuppressionVarianceStore(inner: LegacySuppressionVarianceStore, ttl: number, clockValue: clock.Clock): LegacySuppressionVarianceStore {
  return new CachedLegacySuppressionVarianceStore(
    inner,
    cache.newTtlCache<LegacySuppressionVariance>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy suppression variances. Empty fields match all. */
export class LegacySuppressionVarianceQuery {
  segment: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacySuppressionVariance): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacySuppressionVariance[]): LegacySuppressionVariance[] {
    const matched = collections.filter(items, (candidate: LegacySuppressionVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacySuppressionVariances(store: LegacySuppressionVarianceStore, query: LegacySuppressionVarianceQuery): LegacySuppressionVariance[] {
  return query.apply(store.list());
}
