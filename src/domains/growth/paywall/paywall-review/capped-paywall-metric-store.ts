import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedPaywallMetric } from "./capped-paywall-metric.js";

/** Keeps capped paywall metrics by code. */
export interface CappedPaywallMetricStore {
  find(code: string): CappedPaywallMetric | undefined;
  save(item: CappedPaywallMetric): void;
  remove(code: string): boolean;
  list(): CappedPaywallMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedPaywallMetricStore implements CappedPaywallMetricStore {
  items: Map<string, CappedPaywallMetric>;
  order: string[];

  constructor(items: Map<string, CappedPaywallMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedPaywallMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedPaywallMetric): void {
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

  list(): CappedPaywallMetric[] {
    const out: CappedPaywallMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedPaywallMetricStore(): CappedPaywallMetricStore {
  return new MemoryCappedPaywallMetricStore(new Map<string, CappedPaywallMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedPaywallMetricStore implements CappedPaywallMetricStore {
  inner: CappedPaywallMetricStore;
  cache: cache.TtlCache<CappedPaywallMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedPaywallMetricStore,
    cacheValue: cache.TtlCache<CappedPaywallMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedPaywallMetric | undefined {
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

  save(item: CappedPaywallMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedPaywallMetric[] {
    return this.inner.list();
  }
}

export function newCachedCappedPaywallMetricStore(inner: CappedPaywallMetricStore, ttl: number, clockValue: clock.Clock): CappedPaywallMetricStore {
  return new CachedCappedPaywallMetricStore(inner, cache.newTtlCache<CappedPaywallMetric>(512, ttl, clockValue), 0, 0);
}

/** Selects capped paywall metrics. Empty fields match all. */
export class CappedPaywallMetricQuery {
  title: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minScore: number, statuses: string[], limit: number) {
    this.title = title;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedPaywallMetric): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedPaywallMetric[]): CappedPaywallMetric[] {
    const matched = collections.filter(items, (candidate: CappedPaywallMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedPaywallMetrics(store: CappedPaywallMetricStore, query: CappedPaywallMetricQuery): CappedPaywallMetric[] {
  return query.apply(store.list());
}
