import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingBadgeAssignment } from "./rolling-badge-assignment.js";

/** Keeps rolling badge assignments by code. */
export interface RollingBadgeAssignmentStore {
  find(code: string): RollingBadgeAssignment | undefined;
  save(item: RollingBadgeAssignment): void;
  remove(code: string): boolean;
  list(): RollingBadgeAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingBadgeAssignmentStore implements RollingBadgeAssignmentStore {
  items: Map<string, RollingBadgeAssignment>;
  order: string[];

  constructor(items: Map<string, RollingBadgeAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingBadgeAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingBadgeAssignment): void {
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

  list(): RollingBadgeAssignment[] {
    const out: RollingBadgeAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingBadgeAssignmentStore(): RollingBadgeAssignmentStore {
  return new MemoryRollingBadgeAssignmentStore(new Map<string, RollingBadgeAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingBadgeAssignmentStore implements RollingBadgeAssignmentStore {
  inner: RollingBadgeAssignmentStore;
  cache: cache.TtlCache<RollingBadgeAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingBadgeAssignmentStore,
    cacheValue: cache.TtlCache<RollingBadgeAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingBadgeAssignment | undefined {
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

  save(item: RollingBadgeAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingBadgeAssignment[] {
    return this.inner.list();
  }
}

export function newCachedRollingBadgeAssignmentStore(inner: RollingBadgeAssignmentStore, ttl: number, clockValue: clock.Clock): RollingBadgeAssignmentStore {
  return new CachedRollingBadgeAssignmentStore(
    inner,
    cache.newTtlCache<RollingBadgeAssignment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling badge assignments. Empty fields match all. */
export class RollingBadgeAssignmentQuery {
  country: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minThreshold: number, statuses: string[], limit: number) {
    this.country = country;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingBadgeAssignment): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingBadgeAssignment[]): RollingBadgeAssignment[] {
    const matched = collections.filter(items, (candidate: RollingBadgeAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingBadgeAssignments(store: RollingBadgeAssignmentStore, query: RollingBadgeAssignmentQuery): RollingBadgeAssignment[] {
  return query.apply(store.list());
}
