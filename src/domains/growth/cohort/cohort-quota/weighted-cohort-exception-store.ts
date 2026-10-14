import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedCohortException } from "./weighted-cohort-exception.js";

/** Keeps weighted cohort exceptions by code. */
export interface WeightedCohortExceptionStore {
  find(code: string): WeightedCohortException | undefined;
  save(item: WeightedCohortException): void;
  remove(code: string): boolean;
  list(): WeightedCohortException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedCohortExceptionStore implements WeightedCohortExceptionStore {
  items: Map<string, WeightedCohortException>;
  order: string[];

  constructor(items: Map<string, WeightedCohortException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedCohortException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedCohortException): void {
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

  list(): WeightedCohortException[] {
    const out: WeightedCohortException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedCohortExceptionStore(): WeightedCohortExceptionStore {
  return new MemoryWeightedCohortExceptionStore(new Map<string, WeightedCohortException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedCohortExceptionStore implements WeightedCohortExceptionStore {
  inner: WeightedCohortExceptionStore;
  cache: cache.TtlCache<WeightedCohortException>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedCohortExceptionStore,
    cacheValue: cache.TtlCache<WeightedCohortException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedCohortException | undefined {
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

  save(item: WeightedCohortException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedCohortException[] {
    return this.inner.list();
  }
}

export function newCachedWeightedCohortExceptionStore(inner: WeightedCohortExceptionStore, ttl: number, clockValue: clock.Clock): WeightedCohortExceptionStore {
  return new CachedWeightedCohortExceptionStore(
    inner,
    cache.newTtlCache<WeightedCohortException>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted cohort exceptions. Empty fields match all. */
export class WeightedCohortExceptionQuery {
  channel: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minSequence: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedCohortException): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedCohortException[]): WeightedCohortException[] {
    const matched = collections.filter(items, (candidate: WeightedCohortException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedCohortExceptions(store: WeightedCohortExceptionStore, query: WeightedCohortExceptionQuery): WeightedCohortException[] {
  return query.apply(store.list());
}
