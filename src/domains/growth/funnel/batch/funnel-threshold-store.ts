import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelThreshold } from "./funnel-threshold.js";

/** Keeps funnel thresholds by code. */
export interface FunnelThresholdStore {
  find(code: string): FunnelThreshold | undefined;
  save(item: FunnelThreshold): void;
  remove(code: string): boolean;
  list(): FunnelThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelThresholdStore implements FunnelThresholdStore {
  items: Map<string, FunnelThreshold>;
  order: string[];

  constructor(items: Map<string, FunnelThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelThreshold): void {
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

  list(): FunnelThreshold[] {
    const out: FunnelThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelThresholdStore(): FunnelThresholdStore {
  return new MemoryFunnelThresholdStore(new Map<string, FunnelThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelThresholdStore implements FunnelThresholdStore {
  inner: FunnelThresholdStore;
  cache: cache.TtlCache<FunnelThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: FunnelThresholdStore,
    cacheValue: cache.TtlCache<FunnelThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelThreshold | undefined {
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

  save(item: FunnelThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelThreshold[] {
    return this.inner.list();
  }
}

export function newCachedFunnelThresholdStore(inner: FunnelThresholdStore, ttl: number, clockValue: clock.Clock): FunnelThresholdStore {
  return new CachedFunnelThresholdStore(inner, cache.newTtlCache<FunnelThreshold>(64, ttl, clockValue), 0, 0);
}

/** Selects funnel thresholds. Empty fields match all. */
export class FunnelThresholdQuery {
  title: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAttempts: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelThreshold): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelThreshold[]): FunnelThreshold[] {
    const matched = collections.filter(items, (candidate: FunnelThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelThresholds(store: FunnelThresholdStore, query: FunnelThresholdQuery): FunnelThreshold[] {
  return query.apply(store.list());
}
