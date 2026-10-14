import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveCsatTarget } from "./adaptive-csat-target.js";

/** Keeps adaptive csat targets by code. */
export interface AdaptiveCsatTargetStore {
  find(code: string): AdaptiveCsatTarget | undefined;
  save(item: AdaptiveCsatTarget): void;
  remove(code: string): boolean;
  list(): AdaptiveCsatTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveCsatTargetStore implements AdaptiveCsatTargetStore {
  items: Map<string, AdaptiveCsatTarget>;
  order: string[];

  constructor(items: Map<string, AdaptiveCsatTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveCsatTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveCsatTarget): void {
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

  list(): AdaptiveCsatTarget[] {
    const out: AdaptiveCsatTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveCsatTargetStore(): AdaptiveCsatTargetStore {
  return new MemoryAdaptiveCsatTargetStore(new Map<string, AdaptiveCsatTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveCsatTargetStore implements AdaptiveCsatTargetStore {
  inner: AdaptiveCsatTargetStore;
  cache: cache.TtlCache<AdaptiveCsatTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveCsatTargetStore,
    cacheValue: cache.TtlCache<AdaptiveCsatTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveCsatTarget | undefined {
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

  save(item: AdaptiveCsatTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveCsatTarget[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveCsatTargetStore(inner: AdaptiveCsatTargetStore, ttl: number, clockValue: clock.Clock): AdaptiveCsatTargetStore {
  return new CachedAdaptiveCsatTargetStore(inner, cache.newTtlCache<AdaptiveCsatTarget>(64, ttl, clockValue), 0, 0);
}

/** Selects adaptive csat targets. Empty fields match all. */
export class AdaptiveCsatTargetQuery {
  name: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minLimit: number, statuses: string[], limit: number) {
    this.name = name;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveCsatTarget): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveCsatTarget[]): AdaptiveCsatTarget[] {
    const matched = collections.filter(items, (candidate: AdaptiveCsatTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveCsatTargets(store: AdaptiveCsatTargetStore, query: AdaptiveCsatTargetQuery): AdaptiveCsatTarget[] {
  return query.apply(store.list());
}
