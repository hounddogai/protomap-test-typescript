import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryPacingMetric } from "./primary-pacing-metric.js";

/** Keeps primary pacing metrics by code. */
export interface PrimaryPacingMetricStore {
  find(code: string): PrimaryPacingMetric | undefined;
  save(item: PrimaryPacingMetric): void;
  remove(code: string): boolean;
  list(): PrimaryPacingMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryPacingMetricStore implements PrimaryPacingMetricStore {
  items: Map<string, PrimaryPacingMetric>;
  order: string[];

  constructor(items: Map<string, PrimaryPacingMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryPacingMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryPacingMetric): void {
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

  list(): PrimaryPacingMetric[] {
    const out: PrimaryPacingMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryPacingMetricStore(): PrimaryPacingMetricStore {
  return new MemoryPrimaryPacingMetricStore(new Map<string, PrimaryPacingMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryPacingMetricStore implements PrimaryPacingMetricStore {
  inner: PrimaryPacingMetricStore;
  cache: cache.TtlCache<PrimaryPacingMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryPacingMetricStore,
    cacheValue: cache.TtlCache<PrimaryPacingMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryPacingMetric | undefined {
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

  save(item: PrimaryPacingMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryPacingMetric[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryPacingMetricStore(inner: PrimaryPacingMetricStore, ttl: number, clockValue: clock.Clock): PrimaryPacingMetricStore {
  return new CachedPrimaryPacingMetricStore(inner, cache.newTtlCache<PrimaryPacingMetric>(512, ttl, clockValue), 0, 0);
}

/** Selects primary pacing metrics. Empty fields match all. */
export class PrimaryPacingMetricQuery {
  locale: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCeiling: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryPacingMetric): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryPacingMetric[]): PrimaryPacingMetric[] {
    const matched = collections.filter(items, (candidate: PrimaryPacingMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryPacingMetrics(store: PrimaryPacingMetricStore, query: PrimaryPacingMetricQuery): PrimaryPacingMetric[] {
  return query.apply(store.list());
}
