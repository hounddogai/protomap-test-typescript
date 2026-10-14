import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryTierSegment } from "./primary-tier-segment.js";

/** Keeps primary tier segments by code. */
export interface PrimaryTierSegmentStore {
  find(code: string): PrimaryTierSegment | undefined;
  save(item: PrimaryTierSegment): void;
  remove(code: string): boolean;
  list(): PrimaryTierSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryTierSegmentStore implements PrimaryTierSegmentStore {
  items: Map<string, PrimaryTierSegment>;
  order: string[];

  constructor(items: Map<string, PrimaryTierSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryTierSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryTierSegment): void {
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

  list(): PrimaryTierSegment[] {
    const out: PrimaryTierSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryTierSegmentStore(): PrimaryTierSegmentStore {
  return new MemoryPrimaryTierSegmentStore(new Map<string, PrimaryTierSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryTierSegmentStore implements PrimaryTierSegmentStore {
  inner: PrimaryTierSegmentStore;
  cache: cache.TtlCache<PrimaryTierSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryTierSegmentStore,
    cacheValue: cache.TtlCache<PrimaryTierSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryTierSegment | undefined {
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

  save(item: PrimaryTierSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryTierSegment[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryTierSegmentStore(inner: PrimaryTierSegmentStore, ttl: number, clockValue: clock.Clock): PrimaryTierSegmentStore {
  return new CachedPrimaryTierSegmentStore(inner, cache.newTtlCache<PrimaryTierSegment>(128, ttl, clockValue), 0, 0);
}

/** Selects primary tier segments. Empty fields match all. */
export class PrimaryTierSegmentQuery {
  name: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBudget: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryTierSegment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryTierSegment[]): PrimaryTierSegment[] {
    const matched = collections.filter(items, (candidate: PrimaryTierSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryTierSegments(store: PrimaryTierSegmentStore, query: PrimaryTierSegmentQuery): PrimaryTierSegment[] {
  return query.apply(store.list());
}
