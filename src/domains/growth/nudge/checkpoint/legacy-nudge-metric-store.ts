import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyNudgeMetric } from "./legacy-nudge-metric.js";

/** Keeps legacy nudge metrics by code. */
export interface LegacyNudgeMetricStore {
  find(code: string): LegacyNudgeMetric | undefined;
  save(item: LegacyNudgeMetric): void;
  remove(code: string): boolean;
  list(): LegacyNudgeMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyNudgeMetricStore implements LegacyNudgeMetricStore {
  items: Map<string, LegacyNudgeMetric>;
  order: string[];

  constructor(items: Map<string, LegacyNudgeMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyNudgeMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyNudgeMetric): void {
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

  list(): LegacyNudgeMetric[] {
    const out: LegacyNudgeMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyNudgeMetricStore(): LegacyNudgeMetricStore {
  return new MemoryLegacyNudgeMetricStore(new Map<string, LegacyNudgeMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyNudgeMetricStore implements LegacyNudgeMetricStore {
  inner: LegacyNudgeMetricStore;
  cache: cache.TtlCache<LegacyNudgeMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyNudgeMetricStore,
    cacheValue: cache.TtlCache<LegacyNudgeMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyNudgeMetric | undefined {
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

  save(item: LegacyNudgeMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyNudgeMetric[] {
    return this.inner.list();
  }
}

export function newCachedLegacyNudgeMetricStore(inner: LegacyNudgeMetricStore, ttl: number, clockValue: clock.Clock): LegacyNudgeMetricStore {
  return new CachedLegacyNudgeMetricStore(inner, cache.newTtlCache<LegacyNudgeMetric>(128, ttl, clockValue), 0, 0);
}

/** Selects legacy nudge metrics. Empty fields match all. */
export class LegacyNudgeMetricQuery {
  title: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyNudgeMetric): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyNudgeMetric[]): LegacyNudgeMetric[] {
    const matched = collections.filter(items, (candidate: LegacyNudgeMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyNudgeMetrics(store: LegacyNudgeMetricStore, query: LegacyNudgeMetricQuery): LegacyNudgeMetric[] {
  return query.apply(store.list());
}
