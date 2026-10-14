import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveFrequencyGroup } from "./adaptive-frequency-group.js";

/** Keeps adaptive frequency groups by code. */
export interface AdaptiveFrequencyGroupStore {
  find(code: string): AdaptiveFrequencyGroup | undefined;
  save(item: AdaptiveFrequencyGroup): void;
  remove(code: string): boolean;
  list(): AdaptiveFrequencyGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveFrequencyGroupStore implements AdaptiveFrequencyGroupStore {
  items: Map<string, AdaptiveFrequencyGroup>;
  order: string[];

  constructor(items: Map<string, AdaptiveFrequencyGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveFrequencyGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveFrequencyGroup): void {
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

  list(): AdaptiveFrequencyGroup[] {
    const out: AdaptiveFrequencyGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveFrequencyGroupStore(): AdaptiveFrequencyGroupStore {
  return new MemoryAdaptiveFrequencyGroupStore(new Map<string, AdaptiveFrequencyGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveFrequencyGroupStore implements AdaptiveFrequencyGroupStore {
  inner: AdaptiveFrequencyGroupStore;
  cache: cache.TtlCache<AdaptiveFrequencyGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveFrequencyGroupStore,
    cacheValue: cache.TtlCache<AdaptiveFrequencyGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveFrequencyGroup | undefined {
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

  save(item: AdaptiveFrequencyGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveFrequencyGroup[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveFrequencyGroupStore(inner: AdaptiveFrequencyGroupStore, ttl: number, clockValue: clock.Clock): AdaptiveFrequencyGroupStore {
  return new CachedAdaptiveFrequencyGroupStore(
    inner,
    cache.newTtlCache<AdaptiveFrequencyGroup>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive frequency groups. Empty fields match all. */
export class AdaptiveFrequencyGroupQuery {
  unit: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minCost: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveFrequencyGroup): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveFrequencyGroup[]): AdaptiveFrequencyGroup[] {
    const matched = collections.filter(items, (candidate: AdaptiveFrequencyGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveFrequencyGroups(store: AdaptiveFrequencyGroupStore, query: AdaptiveFrequencyGroupQuery): AdaptiveFrequencyGroup[] {
  return query.apply(store.list());
}
