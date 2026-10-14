import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackQueueThreshold } from "./fallback-queue-threshold.js";

/** Keeps fallback queue thresholds by code. */
export interface FallbackQueueThresholdStore {
  find(code: string): FallbackQueueThreshold | undefined;
  save(item: FallbackQueueThreshold): void;
  remove(code: string): boolean;
  list(): FallbackQueueThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackQueueThresholdStore implements FallbackQueueThresholdStore {
  items: Map<string, FallbackQueueThreshold>;
  order: string[];

  constructor(items: Map<string, FallbackQueueThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackQueueThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackQueueThreshold): void {
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

  list(): FallbackQueueThreshold[] {
    const out: FallbackQueueThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackQueueThresholdStore(): FallbackQueueThresholdStore {
  return new MemoryFallbackQueueThresholdStore(new Map<string, FallbackQueueThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackQueueThresholdStore implements FallbackQueueThresholdStore {
  inner: FallbackQueueThresholdStore;
  cache: cache.TtlCache<FallbackQueueThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackQueueThresholdStore,
    cacheValue: cache.TtlCache<FallbackQueueThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackQueueThreshold | undefined {
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

  save(item: FallbackQueueThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackQueueThreshold[] {
    return this.inner.list();
  }
}

export function newCachedFallbackQueueThresholdStore(inner: FallbackQueueThresholdStore, ttl: number, clockValue: clock.Clock): FallbackQueueThresholdStore {
  return new CachedFallbackQueueThresholdStore(
    inner,
    cache.newTtlCache<FallbackQueueThreshold>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback queue thresholds. Empty fields match all. */
export class FallbackQueueThresholdQuery {
  category: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minOpenRate: number, statuses: string[], limit: number) {
    this.category = category;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackQueueThreshold): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackQueueThreshold[]): FallbackQueueThreshold[] {
    const matched = collections.filter(items, (candidate: FallbackQueueThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackQueueThresholds(store: FallbackQueueThresholdStore, query: FallbackQueueThresholdQuery): FallbackQueueThreshold[] {
  return query.apply(store.list());
}
