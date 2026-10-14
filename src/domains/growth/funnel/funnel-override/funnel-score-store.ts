import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelScore } from "./funnel-score.js";

/** Keeps funnel scores by code. */
export interface FunnelScoreStore {
  find(code: string): FunnelScore | undefined;
  save(item: FunnelScore): void;
  remove(code: string): boolean;
  list(): FunnelScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelScoreStore implements FunnelScoreStore {
  items: Map<string, FunnelScore>;
  order: string[];

  constructor(items: Map<string, FunnelScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelScore): void {
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

  list(): FunnelScore[] {
    const out: FunnelScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelScoreStore(): FunnelScoreStore {
  return new MemoryFunnelScoreStore(new Map<string, FunnelScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelScoreStore implements FunnelScoreStore {
  inner: FunnelScoreStore;
  cache: cache.TtlCache<FunnelScore>;
  hits: number;
  misses: number;

  constructor(inner: FunnelScoreStore, cacheValue: cache.TtlCache<FunnelScore>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelScore | undefined {
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

  save(item: FunnelScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelScore[] {
    return this.inner.list();
  }
}

export function newCachedFunnelScoreStore(inner: FunnelScoreStore, ttl: number, clockValue: clock.Clock): FunnelScoreStore {
  return new CachedFunnelScoreStore(inner, cache.newTtlCache<FunnelScore>(1024, ttl, clockValue), 0, 0);
}

/** Selects funnel scores. Empty fields match all. */
export class FunnelScoreQuery {
  locale: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBatchSize: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelScore): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelScore[]): FunnelScore[] {
    const matched = collections.filter(items, (candidate: FunnelScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelScores(store: FunnelScoreStore, query: FunnelScoreQuery): FunnelScore[] {
  return query.apply(store.list());
}
