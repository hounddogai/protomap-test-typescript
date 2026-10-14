import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalLevelAssignment } from "./global-level-assignment.js";

/** Keeps global level assignments by code. */
export interface GlobalLevelAssignmentStore {
  find(code: string): GlobalLevelAssignment | undefined;
  save(item: GlobalLevelAssignment): void;
  remove(code: string): boolean;
  list(): GlobalLevelAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalLevelAssignmentStore implements GlobalLevelAssignmentStore {
  items: Map<string, GlobalLevelAssignment>;
  order: string[];

  constructor(items: Map<string, GlobalLevelAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalLevelAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalLevelAssignment): void {
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

  list(): GlobalLevelAssignment[] {
    const out: GlobalLevelAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalLevelAssignmentStore(): GlobalLevelAssignmentStore {
  return new MemoryGlobalLevelAssignmentStore(new Map<string, GlobalLevelAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalLevelAssignmentStore implements GlobalLevelAssignmentStore {
  inner: GlobalLevelAssignmentStore;
  cache: cache.TtlCache<GlobalLevelAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalLevelAssignmentStore,
    cacheValue: cache.TtlCache<GlobalLevelAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalLevelAssignment | undefined {
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

  save(item: GlobalLevelAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalLevelAssignment[] {
    return this.inner.list();
  }
}

export function newCachedGlobalLevelAssignmentStore(inner: GlobalLevelAssignmentStore, ttl: number, clockValue: clock.Clock): GlobalLevelAssignmentStore {
  return new CachedGlobalLevelAssignmentStore(
    inner,
    cache.newTtlCache<GlobalLevelAssignment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global level assignments. Empty fields match all. */
export class GlobalLevelAssignmentQuery {
  name: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRetries: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalLevelAssignment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalLevelAssignment[]): GlobalLevelAssignment[] {
    const matched = collections.filter(items, (candidate: GlobalLevelAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalLevelAssignments(store: GlobalLevelAssignmentStore, query: GlobalLevelAssignmentQuery): GlobalLevelAssignment[] {
  return query.apply(store.list());
}
