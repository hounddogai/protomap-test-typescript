import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveTierMapping } from "./adaptive-tier-mapping.js";

/** Keeps adaptive tier mappings by code. */
export interface AdaptiveTierMappingStore {
  find(code: string): AdaptiveTierMapping | undefined;
  save(item: AdaptiveTierMapping): void;
  remove(code: string): boolean;
  list(): AdaptiveTierMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveTierMappingStore implements AdaptiveTierMappingStore {
  items: Map<string, AdaptiveTierMapping>;
  order: string[];

  constructor(items: Map<string, AdaptiveTierMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveTierMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveTierMapping): void {
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

  list(): AdaptiveTierMapping[] {
    const out: AdaptiveTierMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveTierMappingStore(): AdaptiveTierMappingStore {
  return new MemoryAdaptiveTierMappingStore(new Map<string, AdaptiveTierMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveTierMappingStore implements AdaptiveTierMappingStore {
  inner: AdaptiveTierMappingStore;
  cache: cache.TtlCache<AdaptiveTierMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveTierMappingStore,
    cacheValue: cache.TtlCache<AdaptiveTierMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveTierMapping | undefined {
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

  save(item: AdaptiveTierMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveTierMapping[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveTierMappingStore(inner: AdaptiveTierMappingStore, ttl: number, clockValue: clock.Clock): AdaptiveTierMappingStore {
  return new CachedAdaptiveTierMappingStore(inner, cache.newTtlCache<AdaptiveTierMapping>(64, ttl, clockValue), 0, 0);
}

/** Selects adaptive tier mappings. Empty fields match all. */
export class AdaptiveTierMappingQuery {
  region: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveTierMapping): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveTierMapping[]): AdaptiveTierMapping[] {
    const matched = collections.filter(items, (candidate: AdaptiveTierMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveTierMappings(store: AdaptiveTierMappingStore, query: AdaptiveTierMappingQuery): AdaptiveTierMapping[] {
  return query.apply(store.list());
}
