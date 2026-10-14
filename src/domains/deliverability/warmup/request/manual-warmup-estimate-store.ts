import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualWarmupEstimate } from "./manual-warmup-estimate.js";

/** Keeps manual warmup estimates by code. */
export interface ManualWarmupEstimateStore {
  find(code: string): ManualWarmupEstimate | undefined;
  save(item: ManualWarmupEstimate): void;
  remove(code: string): boolean;
  list(): ManualWarmupEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualWarmupEstimateStore implements ManualWarmupEstimateStore {
  items: Map<string, ManualWarmupEstimate>;
  order: string[];

  constructor(items: Map<string, ManualWarmupEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualWarmupEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualWarmupEstimate): void {
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

  list(): ManualWarmupEstimate[] {
    const out: ManualWarmupEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualWarmupEstimateStore(): ManualWarmupEstimateStore {
  return new MemoryManualWarmupEstimateStore(new Map<string, ManualWarmupEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualWarmupEstimateStore implements ManualWarmupEstimateStore {
  inner: ManualWarmupEstimateStore;
  cache: cache.TtlCache<ManualWarmupEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualWarmupEstimateStore,
    cacheValue: cache.TtlCache<ManualWarmupEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualWarmupEstimate | undefined {
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

  save(item: ManualWarmupEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualWarmupEstimate[] {
    return this.inner.list();
  }
}

export function newCachedManualWarmupEstimateStore(inner: ManualWarmupEstimateStore, ttl: number, clockValue: clock.Clock): ManualWarmupEstimateStore {
  return new CachedManualWarmupEstimateStore(
    inner,
    cache.newTtlCache<ManualWarmupEstimate>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual warmup estimates. Empty fields match all. */
export class ManualWarmupEstimateQuery {
  name: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minPriority: number, statuses: string[], limit: number) {
    this.name = name;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualWarmupEstimate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualWarmupEstimate[]): ManualWarmupEstimate[] {
    const matched = collections.filter(items, (candidate: ManualWarmupEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualWarmupEstimates(store: ManualWarmupEstimateStore, query: ManualWarmupEstimateQuery): ManualWarmupEstimate[] {
  return query.apply(store.list());
}
