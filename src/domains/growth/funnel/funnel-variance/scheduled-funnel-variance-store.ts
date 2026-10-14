import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledFunnelVariance } from "./scheduled-funnel-variance.js";

/** Keeps scheduled funnel variances by code. */
export interface ScheduledFunnelVarianceStore {
  find(code: string): ScheduledFunnelVariance | undefined;
  save(item: ScheduledFunnelVariance): void;
  remove(code: string): boolean;
  list(): ScheduledFunnelVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledFunnelVarianceStore implements ScheduledFunnelVarianceStore {
  items: Map<string, ScheduledFunnelVariance>;
  order: string[];

  constructor(items: Map<string, ScheduledFunnelVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledFunnelVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledFunnelVariance): void {
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

  list(): ScheduledFunnelVariance[] {
    const out: ScheduledFunnelVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledFunnelVarianceStore(): ScheduledFunnelVarianceStore {
  return new MemoryScheduledFunnelVarianceStore(new Map<string, ScheduledFunnelVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledFunnelVarianceStore implements ScheduledFunnelVarianceStore {
  inner: ScheduledFunnelVarianceStore;
  cache: cache.TtlCache<ScheduledFunnelVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledFunnelVarianceStore,
    cacheValue: cache.TtlCache<ScheduledFunnelVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledFunnelVariance | undefined {
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

  save(item: ScheduledFunnelVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledFunnelVariance[] {
    return this.inner.list();
  }
}

export function newCachedScheduledFunnelVarianceStore(inner: ScheduledFunnelVarianceStore, ttl: number, clockValue: clock.Clock): ScheduledFunnelVarianceStore {
  return new CachedScheduledFunnelVarianceStore(
    inner,
    cache.newTtlCache<ScheduledFunnelVariance>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled funnel variances. Empty fields match all. */
export class ScheduledFunnelVarianceQuery {
  category: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRetries: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledFunnelVariance): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledFunnelVariance[]): ScheduledFunnelVariance[] {
    const matched = collections.filter(items, (candidate: ScheduledFunnelVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledFunnelVariances(store: ScheduledFunnelVarianceStore, query: ScheduledFunnelVarianceQuery): ScheduledFunnelVariance[] {
  return query.apply(store.list());
}
