import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingTierVariance } from "./pending-tier-variance.js";

/** Keeps pending tier variances by code. */
export interface PendingTierVarianceStore {
  find(code: string): PendingTierVariance | undefined;
  save(item: PendingTierVariance): void;
  remove(code: string): boolean;
  list(): PendingTierVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingTierVarianceStore implements PendingTierVarianceStore {
  items: Map<string, PendingTierVariance>;
  order: string[];

  constructor(items: Map<string, PendingTierVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingTierVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingTierVariance): void {
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

  list(): PendingTierVariance[] {
    const out: PendingTierVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingTierVarianceStore(): PendingTierVarianceStore {
  return new MemoryPendingTierVarianceStore(new Map<string, PendingTierVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingTierVarianceStore implements PendingTierVarianceStore {
  inner: PendingTierVarianceStore;
  cache: cache.TtlCache<PendingTierVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingTierVarianceStore,
    cacheValue: cache.TtlCache<PendingTierVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingTierVariance | undefined {
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

  save(item: PendingTierVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingTierVariance[] {
    return this.inner.list();
  }
}

export function newCachedPendingTierVarianceStore(inner: PendingTierVarianceStore, ttl: number, clockValue: clock.Clock): PendingTierVarianceStore {
  return new CachedPendingTierVarianceStore(inner, cache.newTtlCache<PendingTierVariance>(1024, ttl, clockValue), 0, 0);
}

/** Selects pending tier variances. Empty fields match all. */
export class PendingTierVarianceQuery {
  name: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRevision: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingTierVariance): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingTierVariance[]): PendingTierVariance[] {
    const matched = collections.filter(items, (candidate: PendingTierVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingTierVariances(store: PendingTierVarianceStore, query: PendingTierVarianceQuery): PendingTierVariance[] {
  return query.apply(store.list());
}
