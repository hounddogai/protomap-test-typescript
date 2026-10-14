import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalComplaintVariance } from "./global-complaint-variance.js";

/** Keeps global complaint variances by code. */
export interface GlobalComplaintVarianceStore {
  find(code: string): GlobalComplaintVariance | undefined;
  save(item: GlobalComplaintVariance): void;
  remove(code: string): boolean;
  list(): GlobalComplaintVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalComplaintVarianceStore implements GlobalComplaintVarianceStore {
  items: Map<string, GlobalComplaintVariance>;
  order: string[];

  constructor(items: Map<string, GlobalComplaintVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalComplaintVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalComplaintVariance): void {
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

  list(): GlobalComplaintVariance[] {
    const out: GlobalComplaintVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalComplaintVarianceStore(): GlobalComplaintVarianceStore {
  return new MemoryGlobalComplaintVarianceStore(new Map<string, GlobalComplaintVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalComplaintVarianceStore implements GlobalComplaintVarianceStore {
  inner: GlobalComplaintVarianceStore;
  cache: cache.TtlCache<GlobalComplaintVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalComplaintVarianceStore,
    cacheValue: cache.TtlCache<GlobalComplaintVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalComplaintVariance | undefined {
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

  save(item: GlobalComplaintVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalComplaintVariance[] {
    return this.inner.list();
  }
}

export function newCachedGlobalComplaintVarianceStore(inner: GlobalComplaintVarianceStore, ttl: number, clockValue: clock.Clock): GlobalComplaintVarianceStore {
  return new CachedGlobalComplaintVarianceStore(
    inner,
    cache.newTtlCache<GlobalComplaintVariance>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global complaint variances. Empty fields match all. */
export class GlobalComplaintVarianceQuery {
  channel: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalComplaintVariance): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalComplaintVariance[]): GlobalComplaintVariance[] {
    const matched = collections.filter(items, (candidate: GlobalComplaintVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalComplaintVariances(store: GlobalComplaintVarianceStore, query: GlobalComplaintVarianceQuery): GlobalComplaintVariance[] {
  return query.apply(store.list());
}
