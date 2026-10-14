import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingMetric } from "./pacing-metric.js";

/** Keeps pacing metrics by code. */
export interface PacingMetricStore {
  find(code: string): PacingMetric | undefined;
  save(item: PacingMetric): void;
  remove(code: string): boolean;
  list(): PacingMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingMetricStore implements PacingMetricStore {
  items: Map<string, PacingMetric>;
  order: string[];

  constructor(items: Map<string, PacingMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingMetric): void {
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

  list(): PacingMetric[] {
    const out: PacingMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingMetricStore(): PacingMetricStore {
  return new MemoryPacingMetricStore(new Map<string, PacingMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingMetricStore implements PacingMetricStore {
  inner: PacingMetricStore;
  cache: cache.TtlCache<PacingMetric>;
  hits: number;
  misses: number;

  constructor(inner: PacingMetricStore, cacheValue: cache.TtlCache<PacingMetric>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingMetric | undefined {
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

  save(item: PacingMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingMetric[] {
    return this.inner.list();
  }
}

export function newCachedPacingMetricStore(inner: PacingMetricStore, ttl: number, clockValue: clock.Clock): PacingMetricStore {
  return new CachedPacingMetricStore(inner, cache.newTtlCache<PacingMetric>(512, ttl, clockValue), 0, 0);
}

/** Selects pacing metrics. Empty fields match all. */
export class PacingMetricQuery {
  title: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minWindowDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingMetric): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingMetric[]): PacingMetric[] {
    const matched = collections.filter(items, (candidate: PacingMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingMetrics(store: PacingMetricStore, query: PacingMetricQuery): PacingMetric[] {
  return query.apply(store.list());
}
