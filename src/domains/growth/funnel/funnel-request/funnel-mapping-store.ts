import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelMapping } from "./funnel-mapping.js";

/** Keeps funnel mappings by code. */
export interface FunnelMappingStore {
  find(code: string): FunnelMapping | undefined;
  save(item: FunnelMapping): void;
  remove(code: string): boolean;
  list(): FunnelMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelMappingStore implements FunnelMappingStore {
  items: Map<string, FunnelMapping>;
  order: string[];

  constructor(items: Map<string, FunnelMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelMapping): void {
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

  list(): FunnelMapping[] {
    const out: FunnelMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelMappingStore(): FunnelMappingStore {
  return new MemoryFunnelMappingStore(new Map<string, FunnelMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelMappingStore implements FunnelMappingStore {
  inner: FunnelMappingStore;
  cache: cache.TtlCache<FunnelMapping>;
  hits: number;
  misses: number;

  constructor(inner: FunnelMappingStore, cacheValue: cache.TtlCache<FunnelMapping>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelMapping | undefined {
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

  save(item: FunnelMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelMapping[] {
    return this.inner.list();
  }
}

export function newCachedFunnelMappingStore(inner: FunnelMappingStore, ttl: number, clockValue: clock.Clock): FunnelMappingStore {
  return new CachedFunnelMappingStore(inner, cache.newTtlCache<FunnelMapping>(64, ttl, clockValue), 0, 0);
}

/** Selects funnel mappings. Empty fields match all. */
export class FunnelMappingQuery {
  segment: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minEndsAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelMapping): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelMapping[]): FunnelMapping[] {
    const matched = collections.filter(items, (candidate: FunnelMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelMappings(store: FunnelMappingStore, query: FunnelMappingQuery): FunnelMapping[] {
  return query.apply(store.list());
}
