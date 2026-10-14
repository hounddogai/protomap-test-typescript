import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DomainMetric } from "./domain-metric.js";

/** Keeps domain metrics by code. */
export interface DomainMetricStore {
  find(code: string): DomainMetric | undefined;
  save(item: DomainMetric): void;
  remove(code: string): boolean;
  list(): DomainMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDomainMetricStore implements DomainMetricStore {
  items: Map<string, DomainMetric>;
  order: string[];

  constructor(items: Map<string, DomainMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DomainMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DomainMetric): void {
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

  list(): DomainMetric[] {
    const out: DomainMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDomainMetricStore(): DomainMetricStore {
  return new MemoryDomainMetricStore(new Map<string, DomainMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDomainMetricStore implements DomainMetricStore {
  inner: DomainMetricStore;
  cache: cache.TtlCache<DomainMetric>;
  hits: number;
  misses: number;

  constructor(inner: DomainMetricStore, cacheValue: cache.TtlCache<DomainMetric>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DomainMetric | undefined {
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

  save(item: DomainMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DomainMetric[] {
    return this.inner.list();
  }
}

export function newCachedDomainMetricStore(inner: DomainMetricStore, ttl: number, clockValue: clock.Clock): DomainMetricStore {
  return new CachedDomainMetricStore(inner, cache.newTtlCache<DomainMetric>(256, ttl, clockValue), 0, 0);
}

/** Selects domain metrics. Empty fields match all. */
export class DomainMetricQuery {
  label: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DomainMetric): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DomainMetric[]): DomainMetric[] {
    const matched = collections.filter(items, (candidate: DomainMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDomainMetrics(store: DomainMetricStore, query: DomainMetricQuery): DomainMetric[] {
  return query.apply(store.list());
}
