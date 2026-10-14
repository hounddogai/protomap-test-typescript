import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientReplyMetric } from "./lenient-reply-metric.js";

/** Keeps lenient reply metrics by code. */
export interface LenientReplyMetricStore {
  find(code: string): LenientReplyMetric | undefined;
  save(item: LenientReplyMetric): void;
  remove(code: string): boolean;
  list(): LenientReplyMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientReplyMetricStore implements LenientReplyMetricStore {
  items: Map<string, LenientReplyMetric>;
  order: string[];

  constructor(items: Map<string, LenientReplyMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientReplyMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientReplyMetric): void {
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

  list(): LenientReplyMetric[] {
    const out: LenientReplyMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientReplyMetricStore(): LenientReplyMetricStore {
  return new MemoryLenientReplyMetricStore(new Map<string, LenientReplyMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientReplyMetricStore implements LenientReplyMetricStore {
  inner: LenientReplyMetricStore;
  cache: cache.TtlCache<LenientReplyMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientReplyMetricStore,
    cacheValue: cache.TtlCache<LenientReplyMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientReplyMetric | undefined {
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

  save(item: LenientReplyMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientReplyMetric[] {
    return this.inner.list();
  }
}

export function newCachedLenientReplyMetricStore(inner: LenientReplyMetricStore, ttl: number, clockValue: clock.Clock): LenientReplyMetricStore {
  return new CachedLenientReplyMetricStore(inner, cache.newTtlCache<LenientReplyMetric>(128, ttl, clockValue), 0, 0);
}

/** Selects lenient reply metrics. Empty fields match all. */
export class LenientReplyMetricQuery {
  locale: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minSequence: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientReplyMetric): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientReplyMetric[]): LenientReplyMetric[] {
    const matched = collections.filter(items, (candidate: LenientReplyMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientReplyMetrics(store: LenientReplyMetricStore, query: LenientReplyMetricQuery): LenientReplyMetric[] {
  return query.apply(store.list());
}
