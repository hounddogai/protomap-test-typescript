import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackWaitMapping } from "./fallback-wait-mapping.js";

/** Keeps fallback wait mappings by code. */
export interface FallbackWaitMappingStore {
  find(code: string): FallbackWaitMapping | undefined;
  save(item: FallbackWaitMapping): void;
  remove(code: string): boolean;
  list(): FallbackWaitMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackWaitMappingStore implements FallbackWaitMappingStore {
  items: Map<string, FallbackWaitMapping>;
  order: string[];

  constructor(items: Map<string, FallbackWaitMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackWaitMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackWaitMapping): void {
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

  list(): FallbackWaitMapping[] {
    const out: FallbackWaitMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackWaitMappingStore(): FallbackWaitMappingStore {
  return new MemoryFallbackWaitMappingStore(new Map<string, FallbackWaitMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackWaitMappingStore implements FallbackWaitMappingStore {
  inner: FallbackWaitMappingStore;
  cache: cache.TtlCache<FallbackWaitMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackWaitMappingStore,
    cacheValue: cache.TtlCache<FallbackWaitMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackWaitMapping | undefined {
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

  save(item: FallbackWaitMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackWaitMapping[] {
    return this.inner.list();
  }
}

export function newCachedFallbackWaitMappingStore(inner: FallbackWaitMappingStore, ttl: number, clockValue: clock.Clock): FallbackWaitMappingStore {
  return new CachedFallbackWaitMappingStore(inner, cache.newTtlCache<FallbackWaitMapping>(512, ttl, clockValue), 0, 0);
}

/** Selects fallback wait mappings. Empty fields match all. */
export class FallbackWaitMappingQuery {
  segment: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minBudget: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackWaitMapping): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackWaitMapping[]): FallbackWaitMapping[] {
    const matched = collections.filter(items, (candidate: FallbackWaitMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackWaitMappings(store: FallbackWaitMappingStore, query: FallbackWaitMappingQuery): FallbackWaitMapping[] {
  return query.apply(store.list());
}
