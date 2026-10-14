import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingComplaintVariance } from "./rolling-complaint-variance.js";

/** Keeps rolling complaint variances by code. */
export interface RollingComplaintVarianceStore {
  find(code: string): RollingComplaintVariance | undefined;
  save(item: RollingComplaintVariance): void;
  remove(code: string): boolean;
  list(): RollingComplaintVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingComplaintVarianceStore implements RollingComplaintVarianceStore {
  items: Map<string, RollingComplaintVariance>;
  order: string[];

  constructor(items: Map<string, RollingComplaintVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingComplaintVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingComplaintVariance): void {
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

  list(): RollingComplaintVariance[] {
    const out: RollingComplaintVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingComplaintVarianceStore(): RollingComplaintVarianceStore {
  return new MemoryRollingComplaintVarianceStore(new Map<string, RollingComplaintVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingComplaintVarianceStore implements RollingComplaintVarianceStore {
  inner: RollingComplaintVarianceStore;
  cache: cache.TtlCache<RollingComplaintVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingComplaintVarianceStore,
    cacheValue: cache.TtlCache<RollingComplaintVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingComplaintVariance | undefined {
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

  save(item: RollingComplaintVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingComplaintVariance[] {
    return this.inner.list();
  }
}

export function newCachedRollingComplaintVarianceStore(inner: RollingComplaintVarianceStore, ttl: number, clockValue: clock.Clock): RollingComplaintVarianceStore {
  return new CachedRollingComplaintVarianceStore(
    inner,
    cache.newTtlCache<RollingComplaintVariance>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling complaint variances. Empty fields match all. */
export class RollingComplaintVarianceQuery {
  name: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRetries: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingComplaintVariance): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingComplaintVariance[]): RollingComplaintVariance[] {
    const matched = collections.filter(items, (candidate: RollingComplaintVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingComplaintVariances(store: RollingComplaintVarianceStore, query: RollingComplaintVarianceQuery): RollingComplaintVariance[] {
  return query.apply(store.list());
}
