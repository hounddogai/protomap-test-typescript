import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatEstimate } from "./csat-estimate.js";

/** Keeps csat estimates by code. */
export interface CsatEstimateStore {
  find(code: string): CsatEstimate | undefined;
  save(item: CsatEstimate): void;
  remove(code: string): boolean;
  list(): CsatEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatEstimateStore implements CsatEstimateStore {
  items: Map<string, CsatEstimate>;
  order: string[];

  constructor(items: Map<string, CsatEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatEstimate): void {
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

  list(): CsatEstimate[] {
    const out: CsatEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatEstimateStore(): CsatEstimateStore {
  return new MemoryCsatEstimateStore(new Map<string, CsatEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatEstimateStore implements CsatEstimateStore {
  inner: CsatEstimateStore;
  cache: cache.TtlCache<CsatEstimate>;
  hits: number;
  misses: number;

  constructor(inner: CsatEstimateStore, cacheValue: cache.TtlCache<CsatEstimate>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatEstimate | undefined {
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

  save(item: CsatEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatEstimate[] {
    return this.inner.list();
  }
}

export function newCachedCsatEstimateStore(inner: CsatEstimateStore, ttl: number, clockValue: clock.Clock): CsatEstimateStore {
  return new CachedCsatEstimateStore(inner, cache.newTtlCache<CsatEstimate>(1024, ttl, clockValue), 0, 0);
}

/** Selects csat estimates. Empty fields match all. */
export class CsatEstimateQuery {
  label: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCapacity: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatEstimate): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatEstimate[]): CsatEstimate[] {
    const matched = collections.filter(items, (candidate: CsatEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatEstimates(store: CsatEstimateStore, query: CsatEstimateQuery): CsatEstimate[] {
  return query.apply(store.list());
}
