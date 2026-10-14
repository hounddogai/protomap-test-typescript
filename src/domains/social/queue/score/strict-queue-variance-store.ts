import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictQueueVariance } from "./strict-queue-variance.js";

/** Keeps strict queue variances by code. */
export interface StrictQueueVarianceStore {
  find(code: string): StrictQueueVariance | undefined;
  save(item: StrictQueueVariance): void;
  remove(code: string): boolean;
  list(): StrictQueueVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictQueueVarianceStore implements StrictQueueVarianceStore {
  items: Map<string, StrictQueueVariance>;
  order: string[];

  constructor(items: Map<string, StrictQueueVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictQueueVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictQueueVariance): void {
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

  list(): StrictQueueVariance[] {
    const out: StrictQueueVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictQueueVarianceStore(): StrictQueueVarianceStore {
  return new MemoryStrictQueueVarianceStore(new Map<string, StrictQueueVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictQueueVarianceStore implements StrictQueueVarianceStore {
  inner: StrictQueueVarianceStore;
  cache: cache.TtlCache<StrictQueueVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictQueueVarianceStore,
    cacheValue: cache.TtlCache<StrictQueueVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictQueueVariance | undefined {
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

  save(item: StrictQueueVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictQueueVariance[] {
    return this.inner.list();
  }
}

export function newCachedStrictQueueVarianceStore(inner: StrictQueueVarianceStore, ttl: number, clockValue: clock.Clock): StrictQueueVarianceStore {
  return new CachedStrictQueueVarianceStore(inner, cache.newTtlCache<StrictQueueVariance>(64, ttl, clockValue), 0, 0);
}

/** Selects strict queue variances. Empty fields match all. */
export class StrictQueueVarianceQuery {
  name: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minVersion: number, statuses: string[], limit: number) {
    this.name = name;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictQueueVariance): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictQueueVariance[]): StrictQueueVariance[] {
    const matched = collections.filter(items, (candidate: StrictQueueVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictQueueVariances(store: StrictQueueVarianceStore, query: StrictQueueVarianceQuery): StrictQueueVariance[] {
  return query.apply(store.list());
}
