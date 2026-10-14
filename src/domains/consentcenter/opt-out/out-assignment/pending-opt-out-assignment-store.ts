import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingOptOutAssignment } from "./pending-opt-out-assignment.js";

/** Keeps pending opt out assignments by code. */
export interface PendingOptOutAssignmentStore {
  find(code: string): PendingOptOutAssignment | undefined;
  save(item: PendingOptOutAssignment): void;
  remove(code: string): boolean;
  list(): PendingOptOutAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingOptOutAssignmentStore implements PendingOptOutAssignmentStore {
  items: Map<string, PendingOptOutAssignment>;
  order: string[];

  constructor(items: Map<string, PendingOptOutAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingOptOutAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingOptOutAssignment): void {
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

  list(): PendingOptOutAssignment[] {
    const out: PendingOptOutAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingOptOutAssignmentStore(): PendingOptOutAssignmentStore {
  return new MemoryPendingOptOutAssignmentStore(new Map<string, PendingOptOutAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingOptOutAssignmentStore implements PendingOptOutAssignmentStore {
  inner: PendingOptOutAssignmentStore;
  cache: cache.TtlCache<PendingOptOutAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingOptOutAssignmentStore,
    cacheValue: cache.TtlCache<PendingOptOutAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingOptOutAssignment | undefined {
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

  save(item: PendingOptOutAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingOptOutAssignment[] {
    return this.inner.list();
  }
}

export function newCachedPendingOptOutAssignmentStore(inner: PendingOptOutAssignmentStore, ttl: number, clockValue: clock.Clock): PendingOptOutAssignmentStore {
  return new CachedPendingOptOutAssignmentStore(
    inner,
    cache.newTtlCache<PendingOptOutAssignment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending opt out assignments. Empty fields match all. */
export class PendingOptOutAssignmentQuery {
  category: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRetries: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingOptOutAssignment): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingOptOutAssignment[]): PendingOptOutAssignment[] {
    const matched = collections.filter(items, (candidate: PendingOptOutAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingOptOutAssignments(store: PendingOptOutAssignmentStore, query: PendingOptOutAssignmentQuery): PendingOptOutAssignment[] {
  return query.apply(store.list());
}
