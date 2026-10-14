import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientTicketViewMetric } from "./lenient-ticket-view-metric.js";

/** Keeps lenient ticket view metrics by code. */
export interface LenientTicketViewMetricStore {
  find(code: string): LenientTicketViewMetric | undefined;
  save(item: LenientTicketViewMetric): void;
  remove(code: string): boolean;
  list(): LenientTicketViewMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientTicketViewMetricStore implements LenientTicketViewMetricStore {
  items: Map<string, LenientTicketViewMetric>;
  order: string[];

  constructor(items: Map<string, LenientTicketViewMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientTicketViewMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientTicketViewMetric): void {
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

  list(): LenientTicketViewMetric[] {
    const out: LenientTicketViewMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientTicketViewMetricStore(): LenientTicketViewMetricStore {
  return new MemoryLenientTicketViewMetricStore(new Map<string, LenientTicketViewMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientTicketViewMetricStore implements LenientTicketViewMetricStore {
  inner: LenientTicketViewMetricStore;
  cache: cache.TtlCache<LenientTicketViewMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientTicketViewMetricStore,
    cacheValue: cache.TtlCache<LenientTicketViewMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientTicketViewMetric | undefined {
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

  save(item: LenientTicketViewMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientTicketViewMetric[] {
    return this.inner.list();
  }
}

export function newCachedLenientTicketViewMetricStore(inner: LenientTicketViewMetricStore, ttl: number, clockValue: clock.Clock): LenientTicketViewMetricStore {
  return new CachedLenientTicketViewMetricStore(
    inner,
    cache.newTtlCache<LenientTicketViewMetric>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient ticket view metrics. Empty fields match all. */
export class LenientTicketViewMetricQuery {
  region: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minWeight: number, statuses: string[], limit: number) {
    this.region = region;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientTicketViewMetric): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientTicketViewMetric[]): LenientTicketViewMetric[] {
    const matched = collections.filter(items, (candidate: LenientTicketViewMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientTicketViewMetrics(store: LenientTicketViewMetricStore, query: LenientTicketViewMetricQuery): LenientTicketViewMetric[] {
  return query.apply(store.list());
}
