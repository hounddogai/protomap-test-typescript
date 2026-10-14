import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackSuppressionMapping } from "./fallback-suppression-mapping.js";

/** Keeps fallback suppression mappings by code. */
export interface FallbackSuppressionMappingStore {
  find(code: string): FallbackSuppressionMapping | undefined;
  save(item: FallbackSuppressionMapping): void;
  remove(code: string): boolean;
  list(): FallbackSuppressionMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackSuppressionMappingStore implements FallbackSuppressionMappingStore {
  items: Map<string, FallbackSuppressionMapping>;
  order: string[];

  constructor(items: Map<string, FallbackSuppressionMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackSuppressionMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackSuppressionMapping): void {
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

  list(): FallbackSuppressionMapping[] {
    const out: FallbackSuppressionMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackSuppressionMappingStore(): FallbackSuppressionMappingStore {
  return new MemoryFallbackSuppressionMappingStore(new Map<string, FallbackSuppressionMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackSuppressionMappingStore implements FallbackSuppressionMappingStore {
  inner: FallbackSuppressionMappingStore;
  cache: cache.TtlCache<FallbackSuppressionMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackSuppressionMappingStore,
    cacheValue: cache.TtlCache<FallbackSuppressionMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackSuppressionMapping | undefined {
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

  save(item: FallbackSuppressionMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackSuppressionMapping[] {
    return this.inner.list();
  }
}

export function newCachedFallbackSuppressionMappingStore(inner: FallbackSuppressionMappingStore, ttl: number, clockValue: clock.Clock): FallbackSuppressionMappingStore {
  return new CachedFallbackSuppressionMappingStore(
    inner,
    cache.newTtlCache<FallbackSuppressionMapping>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback suppression mappings. Empty fields match all. */
export class FallbackSuppressionMappingQuery {
  source: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minFloorValue: number, statuses: string[], limit: number) {
    this.source = source;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackSuppressionMapping): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackSuppressionMapping[]): FallbackSuppressionMapping[] {
    const matched = collections.filter(items, (candidate: FallbackSuppressionMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackSuppressionMappings(store: FallbackSuppressionMappingStore, query: FallbackSuppressionMappingQuery): FallbackSuppressionMapping[] {
  return query.apply(store.list());
}
