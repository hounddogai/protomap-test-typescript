import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveSuppressionMapping } from "./adaptive-suppression-mapping.js";

/** Keeps adaptive suppression mappings by code. */
export interface AdaptiveSuppressionMappingStore {
  find(code: string): AdaptiveSuppressionMapping | undefined;
  save(item: AdaptiveSuppressionMapping): void;
  remove(code: string): boolean;
  list(): AdaptiveSuppressionMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveSuppressionMappingStore implements AdaptiveSuppressionMappingStore {
  items: Map<string, AdaptiveSuppressionMapping>;
  order: string[];

  constructor(items: Map<string, AdaptiveSuppressionMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveSuppressionMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveSuppressionMapping): void {
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

  list(): AdaptiveSuppressionMapping[] {
    const out: AdaptiveSuppressionMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveSuppressionMappingStore(): AdaptiveSuppressionMappingStore {
  return new MemoryAdaptiveSuppressionMappingStore(new Map<string, AdaptiveSuppressionMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveSuppressionMappingStore implements AdaptiveSuppressionMappingStore {
  inner: AdaptiveSuppressionMappingStore;
  cache: cache.TtlCache<AdaptiveSuppressionMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveSuppressionMappingStore,
    cacheValue: cache.TtlCache<AdaptiveSuppressionMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveSuppressionMapping | undefined {
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

  save(item: AdaptiveSuppressionMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveSuppressionMapping[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveSuppressionMappingStore(inner: AdaptiveSuppressionMappingStore, ttl: number, clockValue: clock.Clock): AdaptiveSuppressionMappingStore {
  return new CachedAdaptiveSuppressionMappingStore(
    inner,
    cache.newTtlCache<AdaptiveSuppressionMapping>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive suppression mappings. Empty fields match all. */
export class AdaptiveSuppressionMappingQuery {
  name: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minWeight: number, statuses: string[], limit: number) {
    this.name = name;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveSuppressionMapping): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveSuppressionMapping[]): AdaptiveSuppressionMapping[] {
    const matched = collections.filter(items, (candidate: AdaptiveSuppressionMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveSuppressionMappings(store: AdaptiveSuppressionMappingStore, query: AdaptiveSuppressionMappingQuery): AdaptiveSuppressionMapping[] {
  return query.apply(store.list());
}
