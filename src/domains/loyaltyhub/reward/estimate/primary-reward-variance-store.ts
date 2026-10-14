import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryRewardVariance } from "./primary-reward-variance.js";

/** Keeps primary reward variances by code. */
export interface PrimaryRewardVarianceStore {
  find(code: string): PrimaryRewardVariance | undefined;
  save(item: PrimaryRewardVariance): void;
  remove(code: string): boolean;
  list(): PrimaryRewardVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryRewardVarianceStore implements PrimaryRewardVarianceStore {
  items: Map<string, PrimaryRewardVariance>;
  order: string[];

  constructor(items: Map<string, PrimaryRewardVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryRewardVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryRewardVariance): void {
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

  list(): PrimaryRewardVariance[] {
    const out: PrimaryRewardVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryRewardVarianceStore(): PrimaryRewardVarianceStore {
  return new MemoryPrimaryRewardVarianceStore(new Map<string, PrimaryRewardVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryRewardVarianceStore implements PrimaryRewardVarianceStore {
  inner: PrimaryRewardVarianceStore;
  cache: cache.TtlCache<PrimaryRewardVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryRewardVarianceStore,
    cacheValue: cache.TtlCache<PrimaryRewardVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryRewardVariance | undefined {
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

  save(item: PrimaryRewardVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryRewardVariance[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryRewardVarianceStore(inner: PrimaryRewardVarianceStore, ttl: number, clockValue: clock.Clock): PrimaryRewardVarianceStore {
  return new CachedPrimaryRewardVarianceStore(
    inner,
    cache.newTtlCache<PrimaryRewardVariance>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary reward variances. Empty fields match all. */
export class PrimaryRewardVarianceQuery {
  label: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minThreshold: number, statuses: string[], limit: number) {
    this.label = label;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryRewardVariance): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryRewardVariance[]): PrimaryRewardVariance[] {
    const matched = collections.filter(items, (candidate: PrimaryRewardVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryRewardVariances(store: PrimaryRewardVarianceStore, query: PrimaryRewardVarianceQuery): PrimaryRewardVariance[] {
  return query.apply(store.list());
}
