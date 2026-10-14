import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedTouchpointAssignment } from "./weighted-touchpoint-assignment.js";

/** Keeps weighted touchpoint assignments by code. */
export interface WeightedTouchpointAssignmentStore {
  find(code: string): WeightedTouchpointAssignment | undefined;
  save(item: WeightedTouchpointAssignment): void;
  remove(code: string): boolean;
  list(): WeightedTouchpointAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedTouchpointAssignmentStore implements WeightedTouchpointAssignmentStore {
  items: Map<string, WeightedTouchpointAssignment>;
  order: string[];

  constructor(items: Map<string, WeightedTouchpointAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedTouchpointAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedTouchpointAssignment): void {
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

  list(): WeightedTouchpointAssignment[] {
    const out: WeightedTouchpointAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedTouchpointAssignmentStore(): WeightedTouchpointAssignmentStore {
  return new MemoryWeightedTouchpointAssignmentStore(new Map<string, WeightedTouchpointAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedTouchpointAssignmentStore implements WeightedTouchpointAssignmentStore {
  inner: WeightedTouchpointAssignmentStore;
  cache: cache.TtlCache<WeightedTouchpointAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedTouchpointAssignmentStore,
    cacheValue: cache.TtlCache<WeightedTouchpointAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedTouchpointAssignment | undefined {
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

  save(item: WeightedTouchpointAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedTouchpointAssignment[] {
    return this.inner.list();
  }
}

export function newCachedWeightedTouchpointAssignmentStore(inner: WeightedTouchpointAssignmentStore, ttl: number, clockValue: clock.Clock): WeightedTouchpointAssignmentStore {
  return new CachedWeightedTouchpointAssignmentStore(
    inner,
    cache.newTtlCache<WeightedTouchpointAssignment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted touchpoint assignments. Empty fields match all. */
export class WeightedTouchpointAssignmentQuery {
  segment: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minQuantity: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedTouchpointAssignment): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedTouchpointAssignment[]): WeightedTouchpointAssignment[] {
    const matched = collections.filter(items, (candidate: WeightedTouchpointAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedTouchpointAssignments(store: WeightedTouchpointAssignmentStore, query: WeightedTouchpointAssignmentQuery): WeightedTouchpointAssignment[] {
  return query.apply(store.list());
}
