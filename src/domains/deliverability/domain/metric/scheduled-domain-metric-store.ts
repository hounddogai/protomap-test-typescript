import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledDomainMetric } from "./scheduled-domain-metric.js";

/** Keeps scheduled domain metrics by code. */
export interface ScheduledDomainMetricStore {
  find(code: string): ScheduledDomainMetric | undefined;
  save(item: ScheduledDomainMetric): void;
  remove(code: string): boolean;
  list(): ScheduledDomainMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledDomainMetricStore implements ScheduledDomainMetricStore {
  items: Map<string, ScheduledDomainMetric>;
  order: string[];

  constructor(items: Map<string, ScheduledDomainMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledDomainMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledDomainMetric): void {
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

  list(): ScheduledDomainMetric[] {
    const out: ScheduledDomainMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledDomainMetricStore(): ScheduledDomainMetricStore {
  return new MemoryScheduledDomainMetricStore(new Map<string, ScheduledDomainMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledDomainMetricStore implements ScheduledDomainMetricStore {
  inner: ScheduledDomainMetricStore;
  cache: cache.TtlCache<ScheduledDomainMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledDomainMetricStore,
    cacheValue: cache.TtlCache<ScheduledDomainMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledDomainMetric | undefined {
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

  save(item: ScheduledDomainMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledDomainMetric[] {
    return this.inner.list();
  }
}

export function newCachedScheduledDomainMetricStore(inner: ScheduledDomainMetricStore, ttl: number, clockValue: clock.Clock): ScheduledDomainMetricStore {
  return new CachedScheduledDomainMetricStore(
    inner,
    cache.newTtlCache<ScheduledDomainMetric>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled domain metrics. Empty fields match all. */
export class ScheduledDomainMetricQuery {
  country: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minStartsAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledDomainMetric): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledDomainMetric[]): ScheduledDomainMetric[] {
    const matched = collections.filter(items, (candidate: ScheduledDomainMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledDomainMetrics(store: ScheduledDomainMetricStore, query: ScheduledDomainMetricQuery): ScheduledDomainMetric[] {
  return query.apply(store.list());
}
