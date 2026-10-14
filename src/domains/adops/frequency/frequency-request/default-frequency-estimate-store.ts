import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultFrequencyEstimate } from "./default-frequency-estimate.js";

/** Keeps default frequency estimates by code. */
export interface DefaultFrequencyEstimateStore {
  find(code: string): DefaultFrequencyEstimate | undefined;
  save(item: DefaultFrequencyEstimate): void;
  remove(code: string): boolean;
  list(): DefaultFrequencyEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultFrequencyEstimateStore implements DefaultFrequencyEstimateStore {
  items: Map<string, DefaultFrequencyEstimate>;
  order: string[];

  constructor(items: Map<string, DefaultFrequencyEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultFrequencyEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultFrequencyEstimate): void {
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

  list(): DefaultFrequencyEstimate[] {
    const out: DefaultFrequencyEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultFrequencyEstimateStore(): DefaultFrequencyEstimateStore {
  return new MemoryDefaultFrequencyEstimateStore(new Map<string, DefaultFrequencyEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultFrequencyEstimateStore implements DefaultFrequencyEstimateStore {
  inner: DefaultFrequencyEstimateStore;
  cache: cache.TtlCache<DefaultFrequencyEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultFrequencyEstimateStore,
    cacheValue: cache.TtlCache<DefaultFrequencyEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultFrequencyEstimate | undefined {
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

  save(item: DefaultFrequencyEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultFrequencyEstimate[] {
    return this.inner.list();
  }
}

export function newCachedDefaultFrequencyEstimateStore(inner: DefaultFrequencyEstimateStore, ttl: number, clockValue: clock.Clock): DefaultFrequencyEstimateStore {
  return new CachedDefaultFrequencyEstimateStore(
    inner,
    cache.newTtlCache<DefaultFrequencyEstimate>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default frequency estimates. Empty fields match all. */
export class DefaultFrequencyEstimateQuery {
  name: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSequence: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultFrequencyEstimate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultFrequencyEstimate[]): DefaultFrequencyEstimate[] {
    const matched = collections.filter(items, (candidate: DefaultFrequencyEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultFrequencyEstimates(store: DefaultFrequencyEstimateStore, query: DefaultFrequencyEstimateQuery): DefaultFrequencyEstimate[] {
  return query.apply(store.list());
}
