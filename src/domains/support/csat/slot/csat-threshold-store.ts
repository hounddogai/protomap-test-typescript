import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatThreshold } from "./csat-threshold.js";

/** Keeps csat thresholds by code. */
export interface CsatThresholdStore {
  find(code: string): CsatThreshold | undefined;
  save(item: CsatThreshold): void;
  remove(code: string): boolean;
  list(): CsatThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatThresholdStore implements CsatThresholdStore {
  items: Map<string, CsatThreshold>;
  order: string[];

  constructor(items: Map<string, CsatThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatThreshold): void {
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

  list(): CsatThreshold[] {
    const out: CsatThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatThresholdStore(): CsatThresholdStore {
  return new MemoryCsatThresholdStore(new Map<string, CsatThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatThresholdStore implements CsatThresholdStore {
  inner: CsatThresholdStore;
  cache: cache.TtlCache<CsatThreshold>;
  hits: number;
  misses: number;

  constructor(inner: CsatThresholdStore, cacheValue: cache.TtlCache<CsatThreshold>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatThreshold | undefined {
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

  save(item: CsatThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatThreshold[] {
    return this.inner.list();
  }
}

export function newCachedCsatThresholdStore(inner: CsatThresholdStore, ttl: number, clockValue: clock.Clock): CsatThresholdStore {
  return new CachedCsatThresholdStore(inner, cache.newTtlCache<CsatThreshold>(1024, ttl, clockValue), 0, 0);
}

/** Selects csat thresholds. Empty fields match all. */
export class CsatThresholdQuery {
  category: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRatio: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatThreshold): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatThreshold[]): CsatThreshold[] {
    const matched = collections.filter(items, (candidate: CsatThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatThresholds(store: CsatThresholdStore, query: CsatThresholdQuery): CsatThreshold[] {
  return query.apply(store.list());
}
