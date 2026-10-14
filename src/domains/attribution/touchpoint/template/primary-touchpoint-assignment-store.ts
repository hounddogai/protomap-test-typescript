import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryTouchpointAssignment } from "./primary-touchpoint-assignment.js";

/** Keeps primary touchpoint assignments by code. */
export interface PrimaryTouchpointAssignmentStore {
  find(code: string): PrimaryTouchpointAssignment | undefined;
  save(item: PrimaryTouchpointAssignment): void;
  remove(code: string): boolean;
  list(): PrimaryTouchpointAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryTouchpointAssignmentStore implements PrimaryTouchpointAssignmentStore {
  items: Map<string, PrimaryTouchpointAssignment>;
  order: string[];

  constructor(items: Map<string, PrimaryTouchpointAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryTouchpointAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryTouchpointAssignment): void {
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

  list(): PrimaryTouchpointAssignment[] {
    const out: PrimaryTouchpointAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryTouchpointAssignmentStore(): PrimaryTouchpointAssignmentStore {
  return new MemoryPrimaryTouchpointAssignmentStore(new Map<string, PrimaryTouchpointAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryTouchpointAssignmentStore implements PrimaryTouchpointAssignmentStore {
  inner: PrimaryTouchpointAssignmentStore;
  cache: cache.TtlCache<PrimaryTouchpointAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryTouchpointAssignmentStore,
    cacheValue: cache.TtlCache<PrimaryTouchpointAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryTouchpointAssignment | undefined {
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

  save(item: PrimaryTouchpointAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryTouchpointAssignment[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryTouchpointAssignmentStore(inner: PrimaryTouchpointAssignmentStore, ttl: number, clockValue: clock.Clock): PrimaryTouchpointAssignmentStore {
  return new CachedPrimaryTouchpointAssignmentStore(
    inner,
    cache.newTtlCache<PrimaryTouchpointAssignment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary touchpoint assignments. Empty fields match all. */
export class PrimaryTouchpointAssignmentQuery {
  name: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minEndsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryTouchpointAssignment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryTouchpointAssignment[]): PrimaryTouchpointAssignment[] {
    const matched = collections.filter(items, (candidate: PrimaryTouchpointAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryTouchpointAssignments(store: PrimaryTouchpointAssignmentStore, query: PrimaryTouchpointAssignmentQuery): PrimaryTouchpointAssignment[] {
  return query.apply(store.list());
}
