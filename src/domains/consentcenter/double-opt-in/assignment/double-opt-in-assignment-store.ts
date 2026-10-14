import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInAssignment } from "./double-opt-in-assignment.js";

/** Keeps double opt in assignments by code. */
export interface DoubleOptInAssignmentStore {
  find(code: string): DoubleOptInAssignment | undefined;
  save(item: DoubleOptInAssignment): void;
  remove(code: string): boolean;
  list(): DoubleOptInAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInAssignmentStore implements DoubleOptInAssignmentStore {
  items: Map<string, DoubleOptInAssignment>;
  order: string[];

  constructor(items: Map<string, DoubleOptInAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInAssignment): void {
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

  list(): DoubleOptInAssignment[] {
    const out: DoubleOptInAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInAssignmentStore(): DoubleOptInAssignmentStore {
  return new MemoryDoubleOptInAssignmentStore(new Map<string, DoubleOptInAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInAssignmentStore implements DoubleOptInAssignmentStore {
  inner: DoubleOptInAssignmentStore;
  cache: cache.TtlCache<DoubleOptInAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInAssignmentStore,
    cacheValue: cache.TtlCache<DoubleOptInAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInAssignment | undefined {
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

  save(item: DoubleOptInAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInAssignment[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInAssignmentStore(inner: DoubleOptInAssignmentStore, ttl: number, clockValue: clock.Clock): DoubleOptInAssignmentStore {
  return new CachedDoubleOptInAssignmentStore(
    inner,
    cache.newTtlCache<DoubleOptInAssignment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects double opt in assignments. Empty fields match all. */
export class DoubleOptInAssignmentQuery {
  segment: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minFloorValue: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInAssignment): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInAssignment[]): DoubleOptInAssignment[] {
    const matched = collections.filter(items, (candidate: DoubleOptInAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInAssignments(store: DoubleOptInAssignmentStore, query: DoubleOptInAssignmentQuery): DoubleOptInAssignment[] {
  return query.apply(store.list());
}
