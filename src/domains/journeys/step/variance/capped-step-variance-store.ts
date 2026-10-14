import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedStepVariance } from "./capped-step-variance.js";

/** Keeps capped step variances by code. */
export interface CappedStepVarianceStore {
  find(code: string): CappedStepVariance | undefined;
  save(item: CappedStepVariance): void;
  remove(code: string): boolean;
  list(): CappedStepVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedStepVarianceStore implements CappedStepVarianceStore {
  items: Map<string, CappedStepVariance>;
  order: string[];

  constructor(items: Map<string, CappedStepVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedStepVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedStepVariance): void {
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

  list(): CappedStepVariance[] {
    const out: CappedStepVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedStepVarianceStore(): CappedStepVarianceStore {
  return new MemoryCappedStepVarianceStore(new Map<string, CappedStepVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedStepVarianceStore implements CappedStepVarianceStore {
  inner: CappedStepVarianceStore;
  cache: cache.TtlCache<CappedStepVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedStepVarianceStore,
    cacheValue: cache.TtlCache<CappedStepVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedStepVariance | undefined {
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

  save(item: CappedStepVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedStepVariance[] {
    return this.inner.list();
  }
}

export function newCachedCappedStepVarianceStore(inner: CappedStepVarianceStore, ttl: number, clockValue: clock.Clock): CappedStepVarianceStore {
  return new CachedCappedStepVarianceStore(inner, cache.newTtlCache<CappedStepVariance>(64, ttl, clockValue), 0, 0);
}

/** Selects capped step variances. Empty fields match all. */
export class CappedStepVarianceQuery {
  title: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minStartsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedStepVariance): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedStepVariance[]): CappedStepVariance[] {
    const matched = collections.filter(items, (candidate: CappedStepVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedStepVariances(store: CappedStepVarianceStore, query: CappedStepVarianceQuery): CappedStepVariance[] {
  return query.apply(store.list());
}
