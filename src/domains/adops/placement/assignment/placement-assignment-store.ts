import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementAssignment } from "./placement-assignment.js";

/** Keeps placement assignments by code. */
export interface PlacementAssignmentStore {
  find(code: string): PlacementAssignment | undefined;
  save(item: PlacementAssignment): void;
  remove(code: string): boolean;
  list(): PlacementAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementAssignmentStore implements PlacementAssignmentStore {
  items: Map<string, PlacementAssignment>;
  order: string[];

  constructor(items: Map<string, PlacementAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementAssignment): void {
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

  list(): PlacementAssignment[] {
    const out: PlacementAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementAssignmentStore(): PlacementAssignmentStore {
  return new MemoryPlacementAssignmentStore(new Map<string, PlacementAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementAssignmentStore implements PlacementAssignmentStore {
  inner: PlacementAssignmentStore;
  cache: cache.TtlCache<PlacementAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementAssignmentStore,
    cacheValue: cache.TtlCache<PlacementAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementAssignment | undefined {
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

  save(item: PlacementAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementAssignment[] {
    return this.inner.list();
  }
}

export function newCachedPlacementAssignmentStore(inner: PlacementAssignmentStore, ttl: number, clockValue: clock.Clock): PlacementAssignmentStore {
  return new CachedPlacementAssignmentStore(inner, cache.newTtlCache<PlacementAssignment>(256, ttl, clockValue), 0, 0);
}

/** Selects placement assignments. Empty fields match all. */
export class PlacementAssignmentQuery {
  name: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCost: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementAssignment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementAssignment[]): PlacementAssignment[] {
    const matched = collections.filter(items, (candidate: PlacementAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementAssignments(store: PlacementAssignmentStore, query: PlacementAssignmentQuery): PlacementAssignment[] {
  return query.apply(store.list());
}
