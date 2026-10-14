import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientComplaintVariance } from "./lenient-complaint-variance.js";

/** Keeps lenient complaint variances by code. */
export interface LenientComplaintVarianceStore {
  find(code: string): LenientComplaintVariance | undefined;
  save(item: LenientComplaintVariance): void;
  remove(code: string): boolean;
  list(): LenientComplaintVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientComplaintVarianceStore implements LenientComplaintVarianceStore {
  items: Map<string, LenientComplaintVariance>;
  order: string[];

  constructor(items: Map<string, LenientComplaintVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientComplaintVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientComplaintVariance): void {
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

  list(): LenientComplaintVariance[] {
    const out: LenientComplaintVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientComplaintVarianceStore(): LenientComplaintVarianceStore {
  return new MemoryLenientComplaintVarianceStore(new Map<string, LenientComplaintVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientComplaintVarianceStore implements LenientComplaintVarianceStore {
  inner: LenientComplaintVarianceStore;
  cache: cache.TtlCache<LenientComplaintVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientComplaintVarianceStore,
    cacheValue: cache.TtlCache<LenientComplaintVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientComplaintVariance | undefined {
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

  save(item: LenientComplaintVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientComplaintVariance[] {
    return this.inner.list();
  }
}

export function newCachedLenientComplaintVarianceStore(inner: LenientComplaintVarianceStore, ttl: number, clockValue: clock.Clock): LenientComplaintVarianceStore {
  return new CachedLenientComplaintVarianceStore(
    inner,
    cache.newTtlCache<LenientComplaintVariance>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient complaint variances. Empty fields match all. */
export class LenientComplaintVarianceQuery {
  title: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBudget: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientComplaintVariance): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientComplaintVariance[]): LenientComplaintVariance[] {
    const matched = collections.filter(items, (candidate: LenientComplaintVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientComplaintVariances(store: LenientComplaintVarianceStore, query: LenientComplaintVarianceQuery): LenientComplaintVariance[] {
  return query.apply(store.list());
}
