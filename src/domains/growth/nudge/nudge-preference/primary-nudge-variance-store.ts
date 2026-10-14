import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryNudgeVariance } from "./primary-nudge-variance.js";

/** Keeps primary nudge variances by code. */
export interface PrimaryNudgeVarianceStore {
  find(code: string): PrimaryNudgeVariance | undefined;
  save(item: PrimaryNudgeVariance): void;
  remove(code: string): boolean;
  list(): PrimaryNudgeVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryNudgeVarianceStore implements PrimaryNudgeVarianceStore {
  items: Map<string, PrimaryNudgeVariance>;
  order: string[];

  constructor(items: Map<string, PrimaryNudgeVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryNudgeVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryNudgeVariance): void {
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

  list(): PrimaryNudgeVariance[] {
    const out: PrimaryNudgeVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryNudgeVarianceStore(): PrimaryNudgeVarianceStore {
  return new MemoryPrimaryNudgeVarianceStore(new Map<string, PrimaryNudgeVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryNudgeVarianceStore implements PrimaryNudgeVarianceStore {
  inner: PrimaryNudgeVarianceStore;
  cache: cache.TtlCache<PrimaryNudgeVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryNudgeVarianceStore,
    cacheValue: cache.TtlCache<PrimaryNudgeVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryNudgeVariance | undefined {
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

  save(item: PrimaryNudgeVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryNudgeVariance[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryNudgeVarianceStore(inner: PrimaryNudgeVarianceStore, ttl: number, clockValue: clock.Clock): PrimaryNudgeVarianceStore {
  return new CachedPrimaryNudgeVarianceStore(
    inner,
    cache.newTtlCache<PrimaryNudgeVariance>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary nudge variances. Empty fields match all. */
export class PrimaryNudgeVarianceQuery {
  title: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCost: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryNudgeVariance): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryNudgeVariance[]): PrimaryNudgeVariance[] {
    const matched = collections.filter(items, (candidate: PrimaryNudgeVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryNudgeVariances(store: PrimaryNudgeVarianceStore, query: PrimaryNudgeVarianceQuery): PrimaryNudgeVariance[] {
  return query.apply(store.list());
}
