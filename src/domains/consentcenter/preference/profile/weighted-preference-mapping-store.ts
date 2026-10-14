import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedPreferenceMapping } from "./weighted-preference-mapping.js";

/** Keeps weighted preference mappings by code. */
export interface WeightedPreferenceMappingStore {
  find(code: string): WeightedPreferenceMapping | undefined;
  save(item: WeightedPreferenceMapping): void;
  remove(code: string): boolean;
  list(): WeightedPreferenceMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedPreferenceMappingStore implements WeightedPreferenceMappingStore {
  items: Map<string, WeightedPreferenceMapping>;
  order: string[];

  constructor(items: Map<string, WeightedPreferenceMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedPreferenceMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedPreferenceMapping): void {
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

  list(): WeightedPreferenceMapping[] {
    const out: WeightedPreferenceMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedPreferenceMappingStore(): WeightedPreferenceMappingStore {
  return new MemoryWeightedPreferenceMappingStore(new Map<string, WeightedPreferenceMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedPreferenceMappingStore implements WeightedPreferenceMappingStore {
  inner: WeightedPreferenceMappingStore;
  cache: cache.TtlCache<WeightedPreferenceMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedPreferenceMappingStore,
    cacheValue: cache.TtlCache<WeightedPreferenceMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedPreferenceMapping | undefined {
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

  save(item: WeightedPreferenceMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedPreferenceMapping[] {
    return this.inner.list();
  }
}

export function newCachedWeightedPreferenceMappingStore(inner: WeightedPreferenceMappingStore, ttl: number, clockValue: clock.Clock): WeightedPreferenceMappingStore {
  return new CachedWeightedPreferenceMappingStore(
    inner,
    cache.newTtlCache<WeightedPreferenceMapping>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted preference mappings. Empty fields match all. */
export class WeightedPreferenceMappingQuery {
  locale: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCost: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedPreferenceMapping): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedPreferenceMapping[]): WeightedPreferenceMapping[] {
    const matched = collections.filter(items, (candidate: WeightedPreferenceMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedPreferenceMappings(store: WeightedPreferenceMappingStore, query: WeightedPreferenceMappingQuery): WeightedPreferenceMapping[] {
  return query.apply(store.list());
}
