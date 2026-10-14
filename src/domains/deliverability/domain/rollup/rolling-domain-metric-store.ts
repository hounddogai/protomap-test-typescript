import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingDomainMetric } from "./rolling-domain-metric.js";

/** Keeps rolling domain metrics by code. */
export interface RollingDomainMetricStore {
  find(code: string): RollingDomainMetric | undefined;
  save(item: RollingDomainMetric): void;
  remove(code: string): boolean;
  list(): RollingDomainMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingDomainMetricStore implements RollingDomainMetricStore {
  items: Map<string, RollingDomainMetric>;
  order: string[];

  constructor(items: Map<string, RollingDomainMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingDomainMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingDomainMetric): void {
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

  list(): RollingDomainMetric[] {
    const out: RollingDomainMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingDomainMetricStore(): RollingDomainMetricStore {
  return new MemoryRollingDomainMetricStore(new Map<string, RollingDomainMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingDomainMetricStore implements RollingDomainMetricStore {
  inner: RollingDomainMetricStore;
  cache: cache.TtlCache<RollingDomainMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingDomainMetricStore,
    cacheValue: cache.TtlCache<RollingDomainMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingDomainMetric | undefined {
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

  save(item: RollingDomainMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingDomainMetric[] {
    return this.inner.list();
  }
}

export function newCachedRollingDomainMetricStore(inner: RollingDomainMetricStore, ttl: number, clockValue: clock.Clock): RollingDomainMetricStore {
  return new CachedRollingDomainMetricStore(inner, cache.newTtlCache<RollingDomainMetric>(512, ttl, clockValue), 0, 0);
}

/** Selects rolling domain metrics. Empty fields match all. */
export class RollingDomainMetricQuery {
  region: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingDomainMetric): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingDomainMetric[]): RollingDomainMetric[] {
    const matched = collections.filter(items, (candidate: RollingDomainMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingDomainMetrics(store: RollingDomainMetricStore, query: RollingDomainMetricQuery): RollingDomainMetric[] {
  return query.apply(store.list());
}
