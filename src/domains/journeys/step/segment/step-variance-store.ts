import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StepVariance } from "./step-variance.js";

/** Keeps step variances by code. */
export interface StepVarianceStore {
  find(code: string): StepVariance | undefined;
  save(item: StepVariance): void;
  remove(code: string): boolean;
  list(): StepVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStepVarianceStore implements StepVarianceStore {
  items: Map<string, StepVariance>;
  order: string[];

  constructor(items: Map<string, StepVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StepVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StepVariance): void {
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

  list(): StepVariance[] {
    const out: StepVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStepVarianceStore(): StepVarianceStore {
  return new MemoryStepVarianceStore(new Map<string, StepVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStepVarianceStore implements StepVarianceStore {
  inner: StepVarianceStore;
  cache: cache.TtlCache<StepVariance>;
  hits: number;
  misses: number;

  constructor(inner: StepVarianceStore, cacheValue: cache.TtlCache<StepVariance>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StepVariance | undefined {
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

  save(item: StepVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StepVariance[] {
    return this.inner.list();
  }
}

export function newCachedStepVarianceStore(inner: StepVarianceStore, ttl: number, clockValue: clock.Clock): StepVarianceStore {
  return new CachedStepVarianceStore(inner, cache.newTtlCache<StepVariance>(512, ttl, clockValue), 0, 0);
}

/** Selects step variances. Empty fields match all. */
export class StepVarianceQuery {
  name: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCapacity: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StepVariance): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StepVariance[]): StepVariance[] {
    const matched = collections.filter(items, (candidate: StepVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStepVariances(store: StepVarianceStore, query: StepVarianceQuery): StepVariance[] {
  return query.apply(store.list());
}
