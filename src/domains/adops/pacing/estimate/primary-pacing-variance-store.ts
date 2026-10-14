import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryPacingVariance } from "./primary-pacing-variance.js";

/** Keeps primary pacing variances by code. */
export interface PrimaryPacingVarianceStore {
  find(code: string): PrimaryPacingVariance | undefined;
  save(item: PrimaryPacingVariance): void;
  remove(code: string): boolean;
  list(): PrimaryPacingVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryPacingVarianceStore implements PrimaryPacingVarianceStore {
  items: Map<string, PrimaryPacingVariance>;
  order: string[];

  constructor(items: Map<string, PrimaryPacingVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryPacingVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryPacingVariance): void {
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

  list(): PrimaryPacingVariance[] {
    const out: PrimaryPacingVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryPacingVarianceStore(): PrimaryPacingVarianceStore {
  return new MemoryPrimaryPacingVarianceStore(new Map<string, PrimaryPacingVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryPacingVarianceStore implements PrimaryPacingVarianceStore {
  inner: PrimaryPacingVarianceStore;
  cache: cache.TtlCache<PrimaryPacingVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryPacingVarianceStore,
    cacheValue: cache.TtlCache<PrimaryPacingVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryPacingVariance | undefined {
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

  save(item: PrimaryPacingVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryPacingVariance[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryPacingVarianceStore(inner: PrimaryPacingVarianceStore, ttl: number, clockValue: clock.Clock): PrimaryPacingVarianceStore {
  return new CachedPrimaryPacingVarianceStore(
    inner,
    cache.newTtlCache<PrimaryPacingVariance>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary pacing variances. Empty fields match all. */
export class PrimaryPacingVarianceQuery {
  source: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minBudget: number, statuses: string[], limit: number) {
    this.source = source;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryPacingVariance): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryPacingVariance[]): PrimaryPacingVariance[] {
    const matched = collections.filter(items, (candidate: PrimaryPacingVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryPacingVariances(store: PrimaryPacingVarianceStore, query: PrimaryPacingVarianceQuery): PrimaryPacingVariance[] {
  return query.apply(store.list());
}
