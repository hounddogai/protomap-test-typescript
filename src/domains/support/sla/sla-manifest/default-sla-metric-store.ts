import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultSlaMetric } from "./default-sla-metric.js";

/** Keeps default sla metrics by code. */
export interface DefaultSlaMetricStore {
  find(code: string): DefaultSlaMetric | undefined;
  save(item: DefaultSlaMetric): void;
  remove(code: string): boolean;
  list(): DefaultSlaMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultSlaMetricStore implements DefaultSlaMetricStore {
  items: Map<string, DefaultSlaMetric>;
  order: string[];

  constructor(items: Map<string, DefaultSlaMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultSlaMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultSlaMetric): void {
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

  list(): DefaultSlaMetric[] {
    const out: DefaultSlaMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultSlaMetricStore(): DefaultSlaMetricStore {
  return new MemoryDefaultSlaMetricStore(new Map<string, DefaultSlaMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultSlaMetricStore implements DefaultSlaMetricStore {
  inner: DefaultSlaMetricStore;
  cache: cache.TtlCache<DefaultSlaMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultSlaMetricStore,
    cacheValue: cache.TtlCache<DefaultSlaMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultSlaMetric | undefined {
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

  save(item: DefaultSlaMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultSlaMetric[] {
    return this.inner.list();
  }
}

export function newCachedDefaultSlaMetricStore(inner: DefaultSlaMetricStore, ttl: number, clockValue: clock.Clock): DefaultSlaMetricStore {
  return new CachedDefaultSlaMetricStore(inner, cache.newTtlCache<DefaultSlaMetric>(512, ttl, clockValue), 0, 0);
}

/** Selects default sla metrics. Empty fields match all. */
export class DefaultSlaMetricQuery {
  title: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minFloorValue: number, statuses: string[], limit: number) {
    this.title = title;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultSlaMetric): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultSlaMetric[]): DefaultSlaMetric[] {
    const matched = collections.filter(items, (candidate: DefaultSlaMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultSlaMetrics(store: DefaultSlaMetricStore, query: DefaultSlaMetricQuery): DefaultSlaMetric[] {
  return query.apply(store.list());
}
