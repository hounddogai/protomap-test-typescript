import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ComplaintVariance } from "./complaint-variance.js";

/** Keeps complaint variances by code. */
export interface ComplaintVarianceStore {
  find(code: string): ComplaintVariance | undefined;
  save(item: ComplaintVariance): void;
  remove(code: string): boolean;
  list(): ComplaintVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryComplaintVarianceStore implements ComplaintVarianceStore {
  items: Map<string, ComplaintVariance>;
  order: string[];

  constructor(items: Map<string, ComplaintVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ComplaintVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ComplaintVariance): void {
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

  list(): ComplaintVariance[] {
    const out: ComplaintVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryComplaintVarianceStore(): ComplaintVarianceStore {
  return new MemoryComplaintVarianceStore(new Map<string, ComplaintVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedComplaintVarianceStore implements ComplaintVarianceStore {
  inner: ComplaintVarianceStore;
  cache: cache.TtlCache<ComplaintVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: ComplaintVarianceStore,
    cacheValue: cache.TtlCache<ComplaintVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ComplaintVariance | undefined {
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

  save(item: ComplaintVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ComplaintVariance[] {
    return this.inner.list();
  }
}

export function newCachedComplaintVarianceStore(inner: ComplaintVarianceStore, ttl: number, clockValue: clock.Clock): ComplaintVarianceStore {
  return new CachedComplaintVarianceStore(inner, cache.newTtlCache<ComplaintVariance>(64, ttl, clockValue), 0, 0);
}

/** Selects complaint variances. Empty fields match all. */
export class ComplaintVarianceQuery {
  utmSource: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minCapacity: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ComplaintVariance): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ComplaintVariance[]): ComplaintVariance[] {
    const matched = collections.filter(items, (candidate: ComplaintVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findComplaintVariances(store: ComplaintVarianceStore, query: ComplaintVarianceQuery): ComplaintVariance[] {
  return query.apply(store.list());
}
