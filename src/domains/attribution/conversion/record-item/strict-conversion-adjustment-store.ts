import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictConversionAdjustment } from "./strict-conversion-adjustment.js";

/** Keeps strict conversion adjustments by code. */
export interface StrictConversionAdjustmentStore {
  find(code: string): StrictConversionAdjustment | undefined;
  save(item: StrictConversionAdjustment): void;
  remove(code: string): boolean;
  list(): StrictConversionAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictConversionAdjustmentStore implements StrictConversionAdjustmentStore {
  items: Map<string, StrictConversionAdjustment>;
  order: string[];

  constructor(items: Map<string, StrictConversionAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictConversionAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictConversionAdjustment): void {
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

  list(): StrictConversionAdjustment[] {
    const out: StrictConversionAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictConversionAdjustmentStore(): StrictConversionAdjustmentStore {
  return new MemoryStrictConversionAdjustmentStore(new Map<string, StrictConversionAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictConversionAdjustmentStore implements StrictConversionAdjustmentStore {
  inner: StrictConversionAdjustmentStore;
  cache: cache.TtlCache<StrictConversionAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictConversionAdjustmentStore,
    cacheValue: cache.TtlCache<StrictConversionAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictConversionAdjustment | undefined {
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

  save(item: StrictConversionAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictConversionAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedStrictConversionAdjustmentStore(inner: StrictConversionAdjustmentStore, ttl: number, clockValue: clock.Clock): StrictConversionAdjustmentStore {
  return new CachedStrictConversionAdjustmentStore(
    inner,
    cache.newTtlCache<StrictConversionAdjustment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict conversion adjustments. Empty fields match all. */
export class StrictConversionAdjustmentQuery {
  utmSource: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictConversionAdjustment): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictConversionAdjustment[]): StrictConversionAdjustment[] {
    const matched = collections.filter(items, (candidate: StrictConversionAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictConversionAdjustments(store: StrictConversionAdjustmentStore, query: StrictConversionAdjustmentQuery): StrictConversionAdjustment[] {
  return query.apply(store.list());
}
