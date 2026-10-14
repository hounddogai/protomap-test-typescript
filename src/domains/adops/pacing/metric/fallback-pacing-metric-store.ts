import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackPacingMetric } from "./fallback-pacing-metric.js";

/** Keeps fallback pacing metrics by code. */
export interface FallbackPacingMetricStore {
  find(code: string): FallbackPacingMetric | undefined;
  save(item: FallbackPacingMetric): void;
  remove(code: string): boolean;
  list(): FallbackPacingMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackPacingMetricStore implements FallbackPacingMetricStore {
  items: Map<string, FallbackPacingMetric>;
  order: string[];

  constructor(items: Map<string, FallbackPacingMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackPacingMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackPacingMetric): void {
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

  list(): FallbackPacingMetric[] {
    const out: FallbackPacingMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackPacingMetricStore(): FallbackPacingMetricStore {
  return new MemoryFallbackPacingMetricStore(new Map<string, FallbackPacingMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackPacingMetricStore implements FallbackPacingMetricStore {
  inner: FallbackPacingMetricStore;
  cache: cache.TtlCache<FallbackPacingMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackPacingMetricStore,
    cacheValue: cache.TtlCache<FallbackPacingMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackPacingMetric | undefined {
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

  save(item: FallbackPacingMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackPacingMetric[] {
    return this.inner.list();
  }
}

export function newCachedFallbackPacingMetricStore(inner: FallbackPacingMetricStore, ttl: number, clockValue: clock.Clock): FallbackPacingMetricStore {
  return new CachedFallbackPacingMetricStore(inner, cache.newTtlCache<FallbackPacingMetric>(64, ttl, clockValue), 0, 0);
}

/** Selects fallback pacing metrics. Empty fields match all. */
export class FallbackPacingMetricQuery {
  utmSource: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minVersion: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackPacingMetric): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackPacingMetric[]): FallbackPacingMetric[] {
    const matched = collections.filter(items, (candidate: FallbackPacingMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackPacingMetrics(store: FallbackPacingMetricStore, query: FallbackPacingMetricQuery): FallbackPacingMetric[] {
  return query.apply(store.list());
}
