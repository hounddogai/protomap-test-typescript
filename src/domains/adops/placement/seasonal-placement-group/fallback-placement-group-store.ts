import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackPlacementGroup } from "./fallback-placement-group.js";

/** Keeps fallback placement groups by code. */
export interface FallbackPlacementGroupStore {
  find(code: string): FallbackPlacementGroup | undefined;
  save(item: FallbackPlacementGroup): void;
  remove(code: string): boolean;
  list(): FallbackPlacementGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackPlacementGroupStore implements FallbackPlacementGroupStore {
  items: Map<string, FallbackPlacementGroup>;
  order: string[];

  constructor(items: Map<string, FallbackPlacementGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackPlacementGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackPlacementGroup): void {
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

  list(): FallbackPlacementGroup[] {
    const out: FallbackPlacementGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackPlacementGroupStore(): FallbackPlacementGroupStore {
  return new MemoryFallbackPlacementGroupStore(new Map<string, FallbackPlacementGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackPlacementGroupStore implements FallbackPlacementGroupStore {
  inner: FallbackPlacementGroupStore;
  cache: cache.TtlCache<FallbackPlacementGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackPlacementGroupStore,
    cacheValue: cache.TtlCache<FallbackPlacementGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackPlacementGroup | undefined {
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

  save(item: FallbackPlacementGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackPlacementGroup[] {
    return this.inner.list();
  }
}

export function newCachedFallbackPlacementGroupStore(inner: FallbackPlacementGroupStore, ttl: number, clockValue: clock.Clock): FallbackPlacementGroupStore {
  return new CachedFallbackPlacementGroupStore(
    inner,
    cache.newTtlCache<FallbackPlacementGroup>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback placement groups. Empty fields match all. */
export class FallbackPlacementGroupQuery {
  segment: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minStartsAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackPlacementGroup): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackPlacementGroup[]): FallbackPlacementGroup[] {
    const matched = collections.filter(items, (candidate: FallbackPlacementGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackPlacementGroups(store: FallbackPlacementGroupStore, query: FallbackPlacementGroupQuery): FallbackPlacementGroup[] {
  return query.apply(store.list());
}
