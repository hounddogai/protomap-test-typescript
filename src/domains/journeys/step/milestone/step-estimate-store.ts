import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StepEstimate } from "./step-estimate.js";

/** Keeps step estimates by code. */
export interface StepEstimateStore {
  find(code: string): StepEstimate | undefined;
  save(item: StepEstimate): void;
  remove(code: string): boolean;
  list(): StepEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStepEstimateStore implements StepEstimateStore {
  items: Map<string, StepEstimate>;
  order: string[];

  constructor(items: Map<string, StepEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StepEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StepEstimate): void {
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

  list(): StepEstimate[] {
    const out: StepEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStepEstimateStore(): StepEstimateStore {
  return new MemoryStepEstimateStore(new Map<string, StepEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStepEstimateStore implements StepEstimateStore {
  inner: StepEstimateStore;
  cache: cache.TtlCache<StepEstimate>;
  hits: number;
  misses: number;

  constructor(inner: StepEstimateStore, cacheValue: cache.TtlCache<StepEstimate>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StepEstimate | undefined {
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

  save(item: StepEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StepEstimate[] {
    return this.inner.list();
  }
}

export function newCachedStepEstimateStore(inner: StepEstimateStore, ttl: number, clockValue: clock.Clock): StepEstimateStore {
  return new CachedStepEstimateStore(inner, cache.newTtlCache<StepEstimate>(64, ttl, clockValue), 0, 0);
}

/** Selects step estimates. Empty fields match all. */
export class StepEstimateQuery {
  name: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StepEstimate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StepEstimate[]): StepEstimate[] {
    const matched = collections.filter(items, (candidate: StepEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStepEstimates(store: StepEstimateStore, query: StepEstimateQuery): StepEstimate[] {
  return query.apply(store.list());
}
