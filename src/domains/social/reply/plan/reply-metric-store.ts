import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyMetric } from "./reply-metric.js";

/** Keeps reply metrics by code. */
export interface ReplyMetricStore {
  find(code: string): ReplyMetric | undefined;
  save(item: ReplyMetric): void;
  remove(code: string): boolean;
  list(): ReplyMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyMetricStore implements ReplyMetricStore {
  items: Map<string, ReplyMetric>;
  order: string[];

  constructor(items: Map<string, ReplyMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyMetric): void {
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

  list(): ReplyMetric[] {
    const out: ReplyMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyMetricStore(): ReplyMetricStore {
  return new MemoryReplyMetricStore(new Map<string, ReplyMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyMetricStore implements ReplyMetricStore {
  inner: ReplyMetricStore;
  cache: cache.TtlCache<ReplyMetric>;
  hits: number;
  misses: number;

  constructor(inner: ReplyMetricStore, cacheValue: cache.TtlCache<ReplyMetric>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyMetric | undefined {
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

  save(item: ReplyMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyMetric[] {
    return this.inner.list();
  }
}

export function newCachedReplyMetricStore(inner: ReplyMetricStore, ttl: number, clockValue: clock.Clock): ReplyMetricStore {
  return new CachedReplyMetricStore(inner, cache.newTtlCache<ReplyMetric>(256, ttl, clockValue), 0, 0);
}

/** Selects reply metrics. Empty fields match all. */
export class ReplyMetricQuery {
  label: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRetries: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplyMetric): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyMetric[]): ReplyMetric[] {
    const matched = collections.filter(items, (candidate: ReplyMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyMetrics(store: ReplyMetricStore, query: ReplyMetricQuery): ReplyMetric[] {
  return query.apply(store.list());
}
