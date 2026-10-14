import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingReputationMapping } from "./pending-reputation-mapping.js";

/** Keeps pending reputation mappings by code. */
export interface PendingReputationMappingStore {
  find(code: string): PendingReputationMapping | undefined;
  save(item: PendingReputationMapping): void;
  remove(code: string): boolean;
  list(): PendingReputationMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingReputationMappingStore implements PendingReputationMappingStore {
  items: Map<string, PendingReputationMapping>;
  order: string[];

  constructor(items: Map<string, PendingReputationMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingReputationMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingReputationMapping): void {
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

  list(): PendingReputationMapping[] {
    const out: PendingReputationMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingReputationMappingStore(): PendingReputationMappingStore {
  return new MemoryPendingReputationMappingStore(new Map<string, PendingReputationMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingReputationMappingStore implements PendingReputationMappingStore {
  inner: PendingReputationMappingStore;
  cache: cache.TtlCache<PendingReputationMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingReputationMappingStore,
    cacheValue: cache.TtlCache<PendingReputationMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingReputationMapping | undefined {
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

  save(item: PendingReputationMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingReputationMapping[] {
    return this.inner.list();
  }
}

export function newCachedPendingReputationMappingStore(inner: PendingReputationMappingStore, ttl: number, clockValue: clock.Clock): PendingReputationMappingStore {
  return new CachedPendingReputationMappingStore(
    inner,
    cache.newTtlCache<PendingReputationMapping>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending reputation mappings. Empty fields match all. */
export class PendingReputationMappingQuery {
  segment: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minWindowDays: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingReputationMapping): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingReputationMapping[]): PendingReputationMapping[] {
    const matched = collections.filter(items, (candidate: PendingReputationMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingReputationMappings(store: PendingReputationMappingStore, query: PendingReputationMappingQuery): PendingReputationMapping[] {
  return query.apply(store.list());
}
