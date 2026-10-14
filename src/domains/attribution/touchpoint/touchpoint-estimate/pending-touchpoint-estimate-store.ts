import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingTouchpointEstimate } from "./pending-touchpoint-estimate.js";

/** Keeps pending touchpoint estimates by code. */
export interface PendingTouchpointEstimateStore {
  find(code: string): PendingTouchpointEstimate | undefined;
  save(item: PendingTouchpointEstimate): void;
  remove(code: string): boolean;
  list(): PendingTouchpointEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingTouchpointEstimateStore implements PendingTouchpointEstimateStore {
  items: Map<string, PendingTouchpointEstimate>;
  order: string[];

  constructor(items: Map<string, PendingTouchpointEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingTouchpointEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingTouchpointEstimate): void {
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

  list(): PendingTouchpointEstimate[] {
    const out: PendingTouchpointEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingTouchpointEstimateStore(): PendingTouchpointEstimateStore {
  return new MemoryPendingTouchpointEstimateStore(new Map<string, PendingTouchpointEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingTouchpointEstimateStore implements PendingTouchpointEstimateStore {
  inner: PendingTouchpointEstimateStore;
  cache: cache.TtlCache<PendingTouchpointEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingTouchpointEstimateStore,
    cacheValue: cache.TtlCache<PendingTouchpointEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingTouchpointEstimate | undefined {
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

  save(item: PendingTouchpointEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingTouchpointEstimate[] {
    return this.inner.list();
  }
}

export function newCachedPendingTouchpointEstimateStore(inner: PendingTouchpointEstimateStore, ttl: number, clockValue: clock.Clock): PendingTouchpointEstimateStore {
  return new CachedPendingTouchpointEstimateStore(
    inner,
    cache.newTtlCache<PendingTouchpointEstimate>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending touchpoint estimates. Empty fields match all. */
export class PendingTouchpointEstimateQuery {
  segment: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingTouchpointEstimate): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingTouchpointEstimate[]): PendingTouchpointEstimate[] {
    const matched = collections.filter(items, (candidate: PendingTouchpointEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingTouchpointEstimates(store: PendingTouchpointEstimateStore, query: PendingTouchpointEstimateQuery): PendingTouchpointEstimate[] {
  return query.apply(store.list());
}
