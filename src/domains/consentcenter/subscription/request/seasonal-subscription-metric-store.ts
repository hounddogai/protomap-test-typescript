import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalSubscriptionMetric } from "./seasonal-subscription-metric.js";

/** Keeps seasonal subscription metrics by code. */
export interface SeasonalSubscriptionMetricStore {
  find(code: string): SeasonalSubscriptionMetric | undefined;
  save(item: SeasonalSubscriptionMetric): void;
  remove(code: string): boolean;
  list(): SeasonalSubscriptionMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalSubscriptionMetricStore implements SeasonalSubscriptionMetricStore {
  items: Map<string, SeasonalSubscriptionMetric>;
  order: string[];

  constructor(items: Map<string, SeasonalSubscriptionMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalSubscriptionMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalSubscriptionMetric): void {
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

  list(): SeasonalSubscriptionMetric[] {
    const out: SeasonalSubscriptionMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalSubscriptionMetricStore(): SeasonalSubscriptionMetricStore {
  return new MemorySeasonalSubscriptionMetricStore(new Map<string, SeasonalSubscriptionMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalSubscriptionMetricStore implements SeasonalSubscriptionMetricStore {
  inner: SeasonalSubscriptionMetricStore;
  cache: cache.TtlCache<SeasonalSubscriptionMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalSubscriptionMetricStore,
    cacheValue: cache.TtlCache<SeasonalSubscriptionMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalSubscriptionMetric | undefined {
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

  save(item: SeasonalSubscriptionMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalSubscriptionMetric[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalSubscriptionMetricStore(inner: SeasonalSubscriptionMetricStore, ttl: number, clockValue: clock.Clock): SeasonalSubscriptionMetricStore {
  return new CachedSeasonalSubscriptionMetricStore(
    inner,
    cache.newTtlCache<SeasonalSubscriptionMetric>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal subscription metrics. Empty fields match all. */
export class SeasonalSubscriptionMetricQuery {
  locale: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minFloorValue: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalSubscriptionMetric): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalSubscriptionMetric[]): SeasonalSubscriptionMetric[] {
    const matched = collections.filter(items, (candidate: SeasonalSubscriptionMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalSubscriptionMetrics(store: SeasonalSubscriptionMetricStore, query: SeasonalSubscriptionMetricQuery): SeasonalSubscriptionMetric[] {
  return query.apply(store.list());
}
