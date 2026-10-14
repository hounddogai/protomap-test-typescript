import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackFrequencyThreshold } from "./fallback-frequency-threshold.js";

/** Keeps fallback frequency thresholds by code. */
export interface FallbackFrequencyThresholdStore {
  find(code: string): FallbackFrequencyThreshold | undefined;
  save(item: FallbackFrequencyThreshold): void;
  remove(code: string): boolean;
  list(): FallbackFrequencyThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackFrequencyThresholdStore implements FallbackFrequencyThresholdStore {
  items: Map<string, FallbackFrequencyThreshold>;
  order: string[];

  constructor(items: Map<string, FallbackFrequencyThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackFrequencyThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackFrequencyThreshold): void {
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

  list(): FallbackFrequencyThreshold[] {
    const out: FallbackFrequencyThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackFrequencyThresholdStore(): FallbackFrequencyThresholdStore {
  return new MemoryFallbackFrequencyThresholdStore(new Map<string, FallbackFrequencyThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackFrequencyThresholdStore implements FallbackFrequencyThresholdStore {
  inner: FallbackFrequencyThresholdStore;
  cache: cache.TtlCache<FallbackFrequencyThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackFrequencyThresholdStore,
    cacheValue: cache.TtlCache<FallbackFrequencyThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackFrequencyThreshold | undefined {
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

  save(item: FallbackFrequencyThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackFrequencyThreshold[] {
    return this.inner.list();
  }
}

export function newCachedFallbackFrequencyThresholdStore(inner: FallbackFrequencyThresholdStore, ttl: number, clockValue: clock.Clock): FallbackFrequencyThresholdStore {
  return new CachedFallbackFrequencyThresholdStore(
    inner,
    cache.newTtlCache<FallbackFrequencyThreshold>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback frequency thresholds. Empty fields match all. */
export class FallbackFrequencyThresholdQuery {
  title: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minClicks: number, statuses: string[], limit: number) {
    this.title = title;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackFrequencyThreshold): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackFrequencyThreshold[]): FallbackFrequencyThreshold[] {
    const matched = collections.filter(items, (candidate: FallbackFrequencyThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackFrequencyThresholds(store: FallbackFrequencyThresholdStore, query: FallbackFrequencyThresholdQuery): FallbackFrequencyThreshold[] {
  return query.apply(store.list());
}
