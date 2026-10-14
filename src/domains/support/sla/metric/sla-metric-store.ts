import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaMetric } from "./sla-metric.js";

/** Keeps sla metrics by code. */
export interface SlaMetricStore {
  find(code: string): SlaMetric | undefined;
  save(item: SlaMetric): void;
  remove(code: string): boolean;
  list(): SlaMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaMetricStore implements SlaMetricStore {
  items: Map<string, SlaMetric>;
  order: string[];

  constructor(items: Map<string, SlaMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaMetric): void {
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

  list(): SlaMetric[] {
    const out: SlaMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaMetricStore(): SlaMetricStore {
  return new MemorySlaMetricStore(new Map<string, SlaMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaMetricStore implements SlaMetricStore {
  inner: SlaMetricStore;
  cache: cache.TtlCache<SlaMetric>;
  hits: number;
  misses: number;

  constructor(inner: SlaMetricStore, cacheValue: cache.TtlCache<SlaMetric>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaMetric | undefined {
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

  save(item: SlaMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaMetric[] {
    return this.inner.list();
  }
}

export function newCachedSlaMetricStore(inner: SlaMetricStore, ttl: number, clockValue: clock.Clock): SlaMetricStore {
  return new CachedSlaMetricStore(inner, cache.newTtlCache<SlaMetric>(512, ttl, clockValue), 0, 0);
}

/** Selects sla metrics. Empty fields match all. */
export class SlaMetricQuery {
  label: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minLimit: number, statuses: string[], limit: number) {
    this.label = label;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaMetric): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaMetric[]): SlaMetric[] {
    const matched = collections.filter(items, (candidate: SlaMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaMetrics(store: SlaMetricStore, query: SlaMetricQuery): SlaMetric[] {
  return query.apply(store.list());
}
