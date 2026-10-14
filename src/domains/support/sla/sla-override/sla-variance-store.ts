import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaVariance } from "./sla-variance.js";

/** Keeps sla variances by code. */
export interface SlaVarianceStore {
  find(code: string): SlaVariance | undefined;
  save(item: SlaVariance): void;
  remove(code: string): boolean;
  list(): SlaVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaVarianceStore implements SlaVarianceStore {
  items: Map<string, SlaVariance>;
  order: string[];

  constructor(items: Map<string, SlaVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaVariance): void {
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

  list(): SlaVariance[] {
    const out: SlaVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaVarianceStore(): SlaVarianceStore {
  return new MemorySlaVarianceStore(new Map<string, SlaVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaVarianceStore implements SlaVarianceStore {
  inner: SlaVarianceStore;
  cache: cache.TtlCache<SlaVariance>;
  hits: number;
  misses: number;

  constructor(inner: SlaVarianceStore, cacheValue: cache.TtlCache<SlaVariance>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaVariance | undefined {
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

  save(item: SlaVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaVariance[] {
    return this.inner.list();
  }
}

export function newCachedSlaVarianceStore(inner: SlaVarianceStore, ttl: number, clockValue: clock.Clock): SlaVarianceStore {
  return new CachedSlaVarianceStore(inner, cache.newTtlCache<SlaVariance>(128, ttl, clockValue), 0, 0);
}

/** Selects sla variances. Empty fields match all. */
export class SlaVarianceQuery {
  title: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minConversionRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaVariance): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaVariance[]): SlaVariance[] {
    const matched = collections.filter(items, (candidate: SlaVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaVariances(store: SlaVarianceStore, query: SlaVarianceQuery): SlaVariance[] {
  return query.apply(store.list());
}
