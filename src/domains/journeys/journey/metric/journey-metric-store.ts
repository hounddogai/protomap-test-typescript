import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { JourneyMetric } from "./journey-metric.js";

/** Keeps journey metrics by code. */
export interface JourneyMetricStore {
  find(code: string): JourneyMetric | undefined;
  save(item: JourneyMetric): void;
  remove(code: string): boolean;
  list(): JourneyMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryJourneyMetricStore implements JourneyMetricStore {
  items: Map<string, JourneyMetric>;
  order: string[];

  constructor(items: Map<string, JourneyMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): JourneyMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: JourneyMetric): void {
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

  list(): JourneyMetric[] {
    const out: JourneyMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryJourneyMetricStore(): JourneyMetricStore {
  return new MemoryJourneyMetricStore(new Map<string, JourneyMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedJourneyMetricStore implements JourneyMetricStore {
  inner: JourneyMetricStore;
  cache: cache.TtlCache<JourneyMetric>;
  hits: number;
  misses: number;

  constructor(inner: JourneyMetricStore, cacheValue: cache.TtlCache<JourneyMetric>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): JourneyMetric | undefined {
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

  save(item: JourneyMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): JourneyMetric[] {
    return this.inner.list();
  }
}

export function newCachedJourneyMetricStore(inner: JourneyMetricStore, ttl: number, clockValue: clock.Clock): JourneyMetricStore {
  return new CachedJourneyMetricStore(inner, cache.newTtlCache<JourneyMetric>(256, ttl, clockValue), 0, 0);
}

/** Selects journey metrics. Empty fields match all. */
export class JourneyMetricQuery {
  name: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minImpressions: number, statuses: string[], limit: number) {
    this.name = name;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: JourneyMetric): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: JourneyMetric[]): JourneyMetric[] {
    const matched = collections.filter(items, (candidate: JourneyMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findJourneyMetrics(store: JourneyMetricStore, query: JourneyMetricQuery): JourneyMetric[] {
  return query.apply(store.list());
}
