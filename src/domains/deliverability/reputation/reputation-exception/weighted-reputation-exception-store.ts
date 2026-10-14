import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedReputationException } from "./weighted-reputation-exception.js";

/** Keeps weighted reputation exceptions by code. */
export interface WeightedReputationExceptionStore {
  find(code: string): WeightedReputationException | undefined;
  save(item: WeightedReputationException): void;
  remove(code: string): boolean;
  list(): WeightedReputationException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedReputationExceptionStore implements WeightedReputationExceptionStore {
  items: Map<string, WeightedReputationException>;
  order: string[];

  constructor(items: Map<string, WeightedReputationException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedReputationException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedReputationException): void {
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

  list(): WeightedReputationException[] {
    const out: WeightedReputationException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedReputationExceptionStore(): WeightedReputationExceptionStore {
  return new MemoryWeightedReputationExceptionStore(new Map<string, WeightedReputationException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedReputationExceptionStore implements WeightedReputationExceptionStore {
  inner: WeightedReputationExceptionStore;
  cache: cache.TtlCache<WeightedReputationException>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedReputationExceptionStore,
    cacheValue: cache.TtlCache<WeightedReputationException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedReputationException | undefined {
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

  save(item: WeightedReputationException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedReputationException[] {
    return this.inner.list();
  }
}

export function newCachedWeightedReputationExceptionStore(inner: WeightedReputationExceptionStore, ttl: number, clockValue: clock.Clock): WeightedReputationExceptionStore {
  return new CachedWeightedReputationExceptionStore(
    inner,
    cache.newTtlCache<WeightedReputationException>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted reputation exceptions. Empty fields match all. */
export class WeightedReputationExceptionQuery {
  label: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRatio: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedReputationException): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedReputationException[]): WeightedReputationException[] {
    const matched = collections.filter(items, (candidate: WeightedReputationException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedReputationExceptions(store: WeightedReputationExceptionStore, query: WeightedReputationExceptionQuery): WeightedReputationException[] {
  return query.apply(store.list());
}
