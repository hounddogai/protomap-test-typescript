import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostMetric } from "./post-metric.js";

/** Keeps post metrics by code. */
export interface PostMetricStore {
  find(code: string): PostMetric | undefined;
  save(item: PostMetric): void;
  remove(code: string): boolean;
  list(): PostMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostMetricStore implements PostMetricStore {
  items: Map<string, PostMetric>;
  order: string[];

  constructor(items: Map<string, PostMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostMetric): void {
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

  list(): PostMetric[] {
    const out: PostMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostMetricStore(): PostMetricStore {
  return new MemoryPostMetricStore(new Map<string, PostMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostMetricStore implements PostMetricStore {
  inner: PostMetricStore;
  cache: cache.TtlCache<PostMetric>;
  hits: number;
  misses: number;

  constructor(inner: PostMetricStore, cacheValue: cache.TtlCache<PostMetric>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostMetric | undefined {
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

  save(item: PostMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostMetric[] {
    return this.inner.list();
  }
}

export function newCachedPostMetricStore(inner: PostMetricStore, ttl: number, clockValue: clock.Clock): PostMetricStore {
  return new CachedPostMetricStore(inner, cache.newTtlCache<PostMetric>(64, ttl, clockValue), 0, 0);
}

/** Selects post metrics. Empty fields match all. */
export class PostMetricQuery {
  source: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minOpenRate: number, statuses: string[], limit: number) {
    this.source = source;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostMetric): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostMetric[]): PostMetric[] {
    const matched = collections.filter(items, (candidate: PostMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostMetrics(store: PostMetricStore, query: PostMetricQuery): PostMetric[] {
  return query.apply(store.list());
}
