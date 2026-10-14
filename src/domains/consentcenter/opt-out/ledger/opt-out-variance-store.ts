import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { OptOutVariance } from "./opt-out-variance.js";

/** Keeps opt out variances by code. */
export interface OptOutVarianceStore {
  find(code: string): OptOutVariance | undefined;
  save(item: OptOutVariance): void;
  remove(code: string): boolean;
  list(): OptOutVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryOptOutVarianceStore implements OptOutVarianceStore {
  items: Map<string, OptOutVariance>;
  order: string[];

  constructor(items: Map<string, OptOutVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): OptOutVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: OptOutVariance): void {
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

  list(): OptOutVariance[] {
    const out: OptOutVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryOptOutVarianceStore(): OptOutVarianceStore {
  return new MemoryOptOutVarianceStore(new Map<string, OptOutVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedOptOutVarianceStore implements OptOutVarianceStore {
  inner: OptOutVarianceStore;
  cache: cache.TtlCache<OptOutVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: OptOutVarianceStore,
    cacheValue: cache.TtlCache<OptOutVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): OptOutVariance | undefined {
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

  save(item: OptOutVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): OptOutVariance[] {
    return this.inner.list();
  }
}

export function newCachedOptOutVarianceStore(inner: OptOutVarianceStore, ttl: number, clockValue: clock.Clock): OptOutVarianceStore {
  return new CachedOptOutVarianceStore(inner, cache.newTtlCache<OptOutVariance>(128, ttl, clockValue), 0, 0);
}

/** Selects opt out variances. Empty fields match all. */
export class OptOutVarianceQuery {
  unit: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minPriority: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: OptOutVariance): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: OptOutVariance[]): OptOutVariance[] {
    const matched = collections.filter(items, (candidate: OptOutVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findOptOutVariances(store: OptOutVarianceStore, query: OptOutVarianceQuery): OptOutVariance[] {
  return query.apply(store.list());
}
