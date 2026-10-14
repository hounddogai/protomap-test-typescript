import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathMetric } from "./path-metric.js";

/** Keeps path metrics by code. */
export interface PathMetricStore {
  find(code: string): PathMetric | undefined;
  save(item: PathMetric): void;
  remove(code: string): boolean;
  list(): PathMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathMetricStore implements PathMetricStore {
  items: Map<string, PathMetric>;
  order: string[];

  constructor(items: Map<string, PathMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathMetric): void {
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

  list(): PathMetric[] {
    const out: PathMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathMetricStore(): PathMetricStore {
  return new MemoryPathMetricStore(new Map<string, PathMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathMetricStore implements PathMetricStore {
  inner: PathMetricStore;
  cache: cache.TtlCache<PathMetric>;
  hits: number;
  misses: number;

  constructor(inner: PathMetricStore, cacheValue: cache.TtlCache<PathMetric>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathMetric | undefined {
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

  save(item: PathMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathMetric[] {
    return this.inner.list();
  }
}

export function newCachedPathMetricStore(inner: PathMetricStore, ttl: number, clockValue: clock.Clock): PathMetricStore {
  return new CachedPathMetricStore(inner, cache.newTtlCache<PathMetric>(512, ttl, clockValue), 0, 0);
}

/** Selects path metrics. Empty fields match all. */
export class PathMetricQuery {
  name: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFloorValue: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathMetric): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathMetric[]): PathMetric[] {
    const matched = collections.filter(items, (candidate: PathMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathMetrics(store: PathMetricStore, query: PathMetricQuery): PathMetric[] {
  return query.apply(store.list());
}
