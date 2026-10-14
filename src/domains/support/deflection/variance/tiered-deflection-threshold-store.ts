import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredDeflectionThreshold } from "./tiered-deflection-threshold.js";

/** Keeps tiered deflection thresholds by code. */
export interface TieredDeflectionThresholdStore {
  find(code: string): TieredDeflectionThreshold | undefined;
  save(item: TieredDeflectionThreshold): void;
  remove(code: string): boolean;
  list(): TieredDeflectionThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredDeflectionThresholdStore implements TieredDeflectionThresholdStore {
  items: Map<string, TieredDeflectionThreshold>;
  order: string[];

  constructor(items: Map<string, TieredDeflectionThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredDeflectionThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredDeflectionThreshold): void {
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

  list(): TieredDeflectionThreshold[] {
    const out: TieredDeflectionThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredDeflectionThresholdStore(): TieredDeflectionThresholdStore {
  return new MemoryTieredDeflectionThresholdStore(new Map<string, TieredDeflectionThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredDeflectionThresholdStore implements TieredDeflectionThresholdStore {
  inner: TieredDeflectionThresholdStore;
  cache: cache.TtlCache<TieredDeflectionThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredDeflectionThresholdStore,
    cacheValue: cache.TtlCache<TieredDeflectionThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredDeflectionThreshold | undefined {
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

  save(item: TieredDeflectionThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredDeflectionThreshold[] {
    return this.inner.list();
  }
}

export function newCachedTieredDeflectionThresholdStore(inner: TieredDeflectionThresholdStore, ttl: number, clockValue: clock.Clock): TieredDeflectionThresholdStore {
  return new CachedTieredDeflectionThresholdStore(
    inner,
    cache.newTtlCache<TieredDeflectionThreshold>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered deflection thresholds. Empty fields match all. */
export class TieredDeflectionThresholdQuery {
  locale: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minScore: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredDeflectionThreshold): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredDeflectionThreshold[]): TieredDeflectionThreshold[] {
    const matched = collections.filter(items, (candidate: TieredDeflectionThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredDeflectionThresholds(store: TieredDeflectionThresholdStore, query: TieredDeflectionThresholdQuery): TieredDeflectionThreshold[] {
  return query.apply(store.list());
}
