import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencyEstimate } from "./frequency-estimate.js";

/** Keeps frequency estimates by code. */
export interface FrequencyEstimateStore {
  find(code: string): FrequencyEstimate | undefined;
  save(item: FrequencyEstimate): void;
  remove(code: string): boolean;
  list(): FrequencyEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencyEstimateStore implements FrequencyEstimateStore {
  items: Map<string, FrequencyEstimate>;
  order: string[];

  constructor(items: Map<string, FrequencyEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencyEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencyEstimate): void {
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

  list(): FrequencyEstimate[] {
    const out: FrequencyEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencyEstimateStore(): FrequencyEstimateStore {
  return new MemoryFrequencyEstimateStore(new Map<string, FrequencyEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencyEstimateStore implements FrequencyEstimateStore {
  inner: FrequencyEstimateStore;
  cache: cache.TtlCache<FrequencyEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: FrequencyEstimateStore,
    cacheValue: cache.TtlCache<FrequencyEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencyEstimate | undefined {
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

  save(item: FrequencyEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencyEstimate[] {
    return this.inner.list();
  }
}

export function newCachedFrequencyEstimateStore(inner: FrequencyEstimateStore, ttl: number, clockValue: clock.Clock): FrequencyEstimateStore {
  return new CachedFrequencyEstimateStore(inner, cache.newTtlCache<FrequencyEstimate>(512, ttl, clockValue), 0, 0);
}

/** Selects frequency estimates. Empty fields match all. */
export class FrequencyEstimateQuery {
  label: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencyEstimate): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencyEstimate[]): FrequencyEstimate[] {
    const matched = collections.filter(items, (candidate: FrequencyEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencyEstimates(store: FrequencyEstimateStore, query: FrequencyEstimateQuery): FrequencyEstimate[] {
  return query.apply(store.list());
}
