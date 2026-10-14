import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewMetric } from "./ticket-view-metric.js";

/** Keeps ticket view metrics by code. */
export interface TicketViewMetricStore {
  find(code: string): TicketViewMetric | undefined;
  save(item: TicketViewMetric): void;
  remove(code: string): boolean;
  list(): TicketViewMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewMetricStore implements TicketViewMetricStore {
  items: Map<string, TicketViewMetric>;
  order: string[];

  constructor(items: Map<string, TicketViewMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewMetric): void {
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

  list(): TicketViewMetric[] {
    const out: TicketViewMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewMetricStore(): TicketViewMetricStore {
  return new MemoryTicketViewMetricStore(new Map<string, TicketViewMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewMetricStore implements TicketViewMetricStore {
  inner: TicketViewMetricStore;
  cache: cache.TtlCache<TicketViewMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewMetricStore,
    cacheValue: cache.TtlCache<TicketViewMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewMetric | undefined {
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

  save(item: TicketViewMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewMetric[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewMetricStore(inner: TicketViewMetricStore, ttl: number, clockValue: clock.Clock): TicketViewMetricStore {
  return new CachedTicketViewMetricStore(inner, cache.newTtlCache<TicketViewMetric>(1024, ttl, clockValue), 0, 0);
}

/** Selects ticket view metrics. Empty fields match all. */
export class TicketViewMetricQuery {
  title: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minSendAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewMetric): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewMetric[]): TicketViewMetric[] {
    const matched = collections.filter(items, (candidate: TicketViewMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewMetrics(store: TicketViewMetricStore, query: TicketViewMetricQuery): TicketViewMetric[] {
  return query.apply(store.list());
}
