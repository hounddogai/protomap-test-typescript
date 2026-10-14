import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryStreakThreshold } from "./primary-streak-threshold.js";

/** Keeps primary streak thresholds by code. */
export interface PrimaryStreakThresholdStore {
  find(code: string): PrimaryStreakThreshold | undefined;
  save(item: PrimaryStreakThreshold): void;
  remove(code: string): boolean;
  list(): PrimaryStreakThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryStreakThresholdStore implements PrimaryStreakThresholdStore {
  items: Map<string, PrimaryStreakThreshold>;
  order: string[];

  constructor(items: Map<string, PrimaryStreakThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryStreakThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryStreakThreshold): void {
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

  list(): PrimaryStreakThreshold[] {
    const out: PrimaryStreakThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryStreakThresholdStore(): PrimaryStreakThresholdStore {
  return new MemoryPrimaryStreakThresholdStore(new Map<string, PrimaryStreakThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryStreakThresholdStore implements PrimaryStreakThresholdStore {
  inner: PrimaryStreakThresholdStore;
  cache: cache.TtlCache<PrimaryStreakThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryStreakThresholdStore,
    cacheValue: cache.TtlCache<PrimaryStreakThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryStreakThreshold | undefined {
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

  save(item: PrimaryStreakThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryStreakThreshold[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryStreakThresholdStore(inner: PrimaryStreakThresholdStore, ttl: number, clockValue: clock.Clock): PrimaryStreakThresholdStore {
  return new CachedPrimaryStreakThresholdStore(
    inner,
    cache.newTtlCache<PrimaryStreakThreshold>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary streak thresholds. Empty fields match all. */
export class PrimaryStreakThresholdQuery {
  unit: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minMargin: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryStreakThreshold): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryStreakThreshold[]): PrimaryStreakThreshold[] {
    const matched = collections.filter(items, (candidate: PrimaryStreakThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryStreakThresholds(store: PrimaryStreakThresholdStore, query: PrimaryStreakThresholdQuery): PrimaryStreakThreshold[] {
  return query.apply(store.list());
}
