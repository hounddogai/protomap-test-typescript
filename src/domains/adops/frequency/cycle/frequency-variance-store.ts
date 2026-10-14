import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencyVariance } from "./frequency-variance.js";

/** Keeps frequency variances by code. */
export interface FrequencyVarianceStore {
  find(code: string): FrequencyVariance | undefined;
  save(item: FrequencyVariance): void;
  remove(code: string): boolean;
  list(): FrequencyVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencyVarianceStore implements FrequencyVarianceStore {
  items: Map<string, FrequencyVariance>;
  order: string[];

  constructor(items: Map<string, FrequencyVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencyVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencyVariance): void {
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

  list(): FrequencyVariance[] {
    const out: FrequencyVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencyVarianceStore(): FrequencyVarianceStore {
  return new MemoryFrequencyVarianceStore(new Map<string, FrequencyVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencyVarianceStore implements FrequencyVarianceStore {
  inner: FrequencyVarianceStore;
  cache: cache.TtlCache<FrequencyVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: FrequencyVarianceStore,
    cacheValue: cache.TtlCache<FrequencyVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencyVariance | undefined {
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

  save(item: FrequencyVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencyVariance[] {
    return this.inner.list();
  }
}

export function newCachedFrequencyVarianceStore(inner: FrequencyVarianceStore, ttl: number, clockValue: clock.Clock): FrequencyVarianceStore {
  return new CachedFrequencyVarianceStore(inner, cache.newTtlCache<FrequencyVariance>(512, ttl, clockValue), 0, 0);
}

/** Selects frequency variances. Empty fields match all. */
export class FrequencyVarianceQuery {
  source: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minWindowDays: number, statuses: string[], limit: number) {
    this.source = source;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencyVariance): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencyVariance[]): FrequencyVariance[] {
    const matched = collections.filter(items, (candidate: FrequencyVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencyVariances(store: FrequencyVarianceStore, query: FrequencyVarianceQuery): FrequencyVariance[] {
  return query.apply(store.list());
}
