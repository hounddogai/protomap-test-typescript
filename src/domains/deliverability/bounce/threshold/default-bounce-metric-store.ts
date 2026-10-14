import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultBounceMetric } from "./default-bounce-metric.js";

/** Keeps default bounce metrics by code. */
export interface DefaultBounceMetricStore {
  find(code: string): DefaultBounceMetric | undefined;
  save(item: DefaultBounceMetric): void;
  remove(code: string): boolean;
  list(): DefaultBounceMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultBounceMetricStore implements DefaultBounceMetricStore {
  items: Map<string, DefaultBounceMetric>;
  order: string[];

  constructor(items: Map<string, DefaultBounceMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultBounceMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultBounceMetric): void {
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

  list(): DefaultBounceMetric[] {
    const out: DefaultBounceMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultBounceMetricStore(): DefaultBounceMetricStore {
  return new MemoryDefaultBounceMetricStore(new Map<string, DefaultBounceMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultBounceMetricStore implements DefaultBounceMetricStore {
  inner: DefaultBounceMetricStore;
  cache: cache.TtlCache<DefaultBounceMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultBounceMetricStore,
    cacheValue: cache.TtlCache<DefaultBounceMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultBounceMetric | undefined {
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

  save(item: DefaultBounceMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultBounceMetric[] {
    return this.inner.list();
  }
}

export function newCachedDefaultBounceMetricStore(inner: DefaultBounceMetricStore, ttl: number, clockValue: clock.Clock): DefaultBounceMetricStore {
  return new CachedDefaultBounceMetricStore(inner, cache.newTtlCache<DefaultBounceMetric>(256, ttl, clockValue), 0, 0);
}

/** Selects default bounce metrics. Empty fields match all. */
export class DefaultBounceMetricQuery {
  region: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minOpenRate: number, statuses: string[], limit: number) {
    this.region = region;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultBounceMetric): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultBounceMetric[]): DefaultBounceMetric[] {
    const matched = collections.filter(items, (candidate: DefaultBounceMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultBounceMetrics(store: DefaultBounceMetricStore, query: DefaultBounceMetricQuery): DefaultBounceMetric[] {
  return query.apply(store.list());
}
