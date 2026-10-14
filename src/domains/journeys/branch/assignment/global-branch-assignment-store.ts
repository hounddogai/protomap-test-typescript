import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalBranchAssignment } from "./global-branch-assignment.js";

/** Keeps global branch assignments by code. */
export interface GlobalBranchAssignmentStore {
  find(code: string): GlobalBranchAssignment | undefined;
  save(item: GlobalBranchAssignment): void;
  remove(code: string): boolean;
  list(): GlobalBranchAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalBranchAssignmentStore implements GlobalBranchAssignmentStore {
  items: Map<string, GlobalBranchAssignment>;
  order: string[];

  constructor(items: Map<string, GlobalBranchAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalBranchAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalBranchAssignment): void {
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

  list(): GlobalBranchAssignment[] {
    const out: GlobalBranchAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalBranchAssignmentStore(): GlobalBranchAssignmentStore {
  return new MemoryGlobalBranchAssignmentStore(new Map<string, GlobalBranchAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalBranchAssignmentStore implements GlobalBranchAssignmentStore {
  inner: GlobalBranchAssignmentStore;
  cache: cache.TtlCache<GlobalBranchAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalBranchAssignmentStore,
    cacheValue: cache.TtlCache<GlobalBranchAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalBranchAssignment | undefined {
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

  save(item: GlobalBranchAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalBranchAssignment[] {
    return this.inner.list();
  }
}

export function newCachedGlobalBranchAssignmentStore(inner: GlobalBranchAssignmentStore, ttl: number, clockValue: clock.Clock): GlobalBranchAssignmentStore {
  return new CachedGlobalBranchAssignmentStore(
    inner,
    cache.newTtlCache<GlobalBranchAssignment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global branch assignments. Empty fields match all. */
export class GlobalBranchAssignmentQuery {
  unit: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minPriority: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalBranchAssignment): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalBranchAssignment[]): GlobalBranchAssignment[] {
    const matched = collections.filter(items, (candidate: GlobalBranchAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalBranchAssignments(store: GlobalBranchAssignmentStore, query: GlobalBranchAssignmentQuery): GlobalBranchAssignment[] {
  return query.apply(store.list());
}
