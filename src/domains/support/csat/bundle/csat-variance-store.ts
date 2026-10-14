import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatVariance } from "./csat-variance.js";

/** Keeps csat variances by code. */
export interface CsatVarianceStore {
  find(code: string): CsatVariance | undefined;
  save(item: CsatVariance): void;
  remove(code: string): boolean;
  list(): CsatVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatVarianceStore implements CsatVarianceStore {
  items: Map<string, CsatVariance>;
  order: string[];

  constructor(items: Map<string, CsatVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatVariance): void {
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

  list(): CsatVariance[] {
    const out: CsatVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatVarianceStore(): CsatVarianceStore {
  return new MemoryCsatVarianceStore(new Map<string, CsatVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatVarianceStore implements CsatVarianceStore {
  inner: CsatVarianceStore;
  cache: cache.TtlCache<CsatVariance>;
  hits: number;
  misses: number;

  constructor(inner: CsatVarianceStore, cacheValue: cache.TtlCache<CsatVariance>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatVariance | undefined {
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

  save(item: CsatVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatVariance[] {
    return this.inner.list();
  }
}

export function newCachedCsatVarianceStore(inner: CsatVarianceStore, ttl: number, clockValue: clock.Clock): CsatVarianceStore {
  return new CachedCsatVarianceStore(inner, cache.newTtlCache<CsatVariance>(128, ttl, clockValue), 0, 0);
}

/** Selects csat variances. Empty fields match all. */
export class CsatVarianceQuery {
  label: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMargin: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatVariance): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatVariance[]): CsatVariance[] {
    const matched = collections.filter(items, (candidate: CsatVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatVariances(store: CsatVarianceStore, query: CsatVarianceQuery): CsatVariance[] {
  return query.apply(store.list());
}
