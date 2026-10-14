import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteMetric } from "./invite-metric.js";

/** Keeps invite metrics by code. */
export interface InviteMetricStore {
  find(code: string): InviteMetric | undefined;
  save(item: InviteMetric): void;
  remove(code: string): boolean;
  list(): InviteMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteMetricStore implements InviteMetricStore {
  items: Map<string, InviteMetric>;
  order: string[];

  constructor(items: Map<string, InviteMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteMetric): void {
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

  list(): InviteMetric[] {
    const out: InviteMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteMetricStore(): InviteMetricStore {
  return new MemoryInviteMetricStore(new Map<string, InviteMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteMetricStore implements InviteMetricStore {
  inner: InviteMetricStore;
  cache: cache.TtlCache<InviteMetric>;
  hits: number;
  misses: number;

  constructor(inner: InviteMetricStore, cacheValue: cache.TtlCache<InviteMetric>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteMetric | undefined {
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

  save(item: InviteMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteMetric[] {
    return this.inner.list();
  }
}

export function newCachedInviteMetricStore(inner: InviteMetricStore, ttl: number, clockValue: clock.Clock): InviteMetricStore {
  return new CachedInviteMetricStore(inner, cache.newTtlCache<InviteMetric>(128, ttl, clockValue), 0, 0);
}

/** Selects invite metrics. Empty fields match all. */
export class InviteMetricQuery {
  locale: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRatio: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteMetric): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteMetric[]): InviteMetric[] {
    const matched = collections.filter(items, (candidate: InviteMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteMetrics(store: InviteMetricStore, query: InviteMetricQuery): InviteMetric[] {
  return query.apply(store.list());
}
