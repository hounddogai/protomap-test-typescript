import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictLevelVariance } from "./strict-level-variance.js";

/** Keeps strict level variances by code. */
export interface StrictLevelVarianceStore {
  find(code: string): StrictLevelVariance | undefined;
  save(item: StrictLevelVariance): void;
  remove(code: string): boolean;
  list(): StrictLevelVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictLevelVarianceStore implements StrictLevelVarianceStore {
  items: Map<string, StrictLevelVariance>;
  order: string[];

  constructor(items: Map<string, StrictLevelVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictLevelVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictLevelVariance): void {
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

  list(): StrictLevelVariance[] {
    const out: StrictLevelVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictLevelVarianceStore(): StrictLevelVarianceStore {
  return new MemoryStrictLevelVarianceStore(new Map<string, StrictLevelVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictLevelVarianceStore implements StrictLevelVarianceStore {
  inner: StrictLevelVarianceStore;
  cache: cache.TtlCache<StrictLevelVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictLevelVarianceStore,
    cacheValue: cache.TtlCache<StrictLevelVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictLevelVariance | undefined {
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

  save(item: StrictLevelVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictLevelVariance[] {
    return this.inner.list();
  }
}

export function newCachedStrictLevelVarianceStore(inner: StrictLevelVarianceStore, ttl: number, clockValue: clock.Clock): StrictLevelVarianceStore {
  return new CachedStrictLevelVarianceStore(inner, cache.newTtlCache<StrictLevelVariance>(512, ttl, clockValue), 0, 0);
}

/** Selects strict level variances. Empty fields match all. */
export class StrictLevelVarianceQuery {
  country: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minStartsAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictLevelVariance): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictLevelVariance[]): StrictLevelVariance[] {
    const matched = collections.filter(items, (candidate: StrictLevelVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictLevelVariances(store: StrictLevelVarianceStore, query: StrictLevelVarianceQuery): StrictLevelVariance[] {
  return query.apply(store.list());
}
