import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingLeaderboardAssignment } from "./rolling-leaderboard-assignment.js";

/** Keeps rolling leaderboard assignments by code. */
export interface RollingLeaderboardAssignmentStore {
  find(code: string): RollingLeaderboardAssignment | undefined;
  save(item: RollingLeaderboardAssignment): void;
  remove(code: string): boolean;
  list(): RollingLeaderboardAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingLeaderboardAssignmentStore implements RollingLeaderboardAssignmentStore {
  items: Map<string, RollingLeaderboardAssignment>;
  order: string[];

  constructor(items: Map<string, RollingLeaderboardAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingLeaderboardAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingLeaderboardAssignment): void {
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

  list(): RollingLeaderboardAssignment[] {
    const out: RollingLeaderboardAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingLeaderboardAssignmentStore(): RollingLeaderboardAssignmentStore {
  return new MemoryRollingLeaderboardAssignmentStore(new Map<string, RollingLeaderboardAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingLeaderboardAssignmentStore implements RollingLeaderboardAssignmentStore {
  inner: RollingLeaderboardAssignmentStore;
  cache: cache.TtlCache<RollingLeaderboardAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingLeaderboardAssignmentStore,
    cacheValue: cache.TtlCache<RollingLeaderboardAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingLeaderboardAssignment | undefined {
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

  save(item: RollingLeaderboardAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingLeaderboardAssignment[] {
    return this.inner.list();
  }
}

export function newCachedRollingLeaderboardAssignmentStore(inner: RollingLeaderboardAssignmentStore, ttl: number, clockValue: clock.Clock): RollingLeaderboardAssignmentStore {
  return new CachedRollingLeaderboardAssignmentStore(
    inner,
    cache.newTtlCache<RollingLeaderboardAssignment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling leaderboard assignments. Empty fields match all. */
export class RollingLeaderboardAssignmentQuery {
  unit: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingLeaderboardAssignment): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingLeaderboardAssignment[]): RollingLeaderboardAssignment[] {
    const matched = collections.filter(items, (candidate: RollingLeaderboardAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingLeaderboardAssignments(store: RollingLeaderboardAssignmentStore, query: RollingLeaderboardAssignmentQuery): RollingLeaderboardAssignment[] {
  return query.apply(store.list());
}
