import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalEscalationMetric } from "./seasonal-escalation-metric.js";

/** Keeps seasonal escalation metrics by code. */
export interface SeasonalEscalationMetricStore {
  find(code: string): SeasonalEscalationMetric | undefined;
  save(item: SeasonalEscalationMetric): void;
  remove(code: string): boolean;
  list(): SeasonalEscalationMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalEscalationMetricStore implements SeasonalEscalationMetricStore {
  items: Map<string, SeasonalEscalationMetric>;
  order: string[];

  constructor(items: Map<string, SeasonalEscalationMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalEscalationMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalEscalationMetric): void {
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

  list(): SeasonalEscalationMetric[] {
    const out: SeasonalEscalationMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalEscalationMetricStore(): SeasonalEscalationMetricStore {
  return new MemorySeasonalEscalationMetricStore(new Map<string, SeasonalEscalationMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalEscalationMetricStore implements SeasonalEscalationMetricStore {
  inner: SeasonalEscalationMetricStore;
  cache: cache.TtlCache<SeasonalEscalationMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalEscalationMetricStore,
    cacheValue: cache.TtlCache<SeasonalEscalationMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalEscalationMetric | undefined {
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

  save(item: SeasonalEscalationMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalEscalationMetric[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalEscalationMetricStore(inner: SeasonalEscalationMetricStore, ttl: number, clockValue: clock.Clock): SeasonalEscalationMetricStore {
  return new CachedSeasonalEscalationMetricStore(
    inner,
    cache.newTtlCache<SeasonalEscalationMetric>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal escalation metrics. Empty fields match all. */
export class SeasonalEscalationMetricQuery {
  channel: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCapacity: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalEscalationMetric): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalEscalationMetric[]): SeasonalEscalationMetric[] {
    const matched = collections.filter(items, (candidate: SeasonalEscalationMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalEscalationMetrics(store: SeasonalEscalationMetricStore, query: SeasonalEscalationMetricQuery): SeasonalEscalationMetric[] {
  return query.apply(store.list());
}
