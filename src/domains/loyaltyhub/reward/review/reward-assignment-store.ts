import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardAssignment } from "./reward-assignment.js";

/** Keeps reward assignments by code. */
export interface RewardAssignmentStore {
  find(code: string): RewardAssignment | undefined;
  save(item: RewardAssignment): void;
  remove(code: string): boolean;
  list(): RewardAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardAssignmentStore implements RewardAssignmentStore {
  items: Map<string, RewardAssignment>;
  order: string[];

  constructor(items: Map<string, RewardAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardAssignment): void {
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

  list(): RewardAssignment[] {
    const out: RewardAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardAssignmentStore(): RewardAssignmentStore {
  return new MemoryRewardAssignmentStore(new Map<string, RewardAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardAssignmentStore implements RewardAssignmentStore {
  inner: RewardAssignmentStore;
  cache: cache.TtlCache<RewardAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardAssignmentStore,
    cacheValue: cache.TtlCache<RewardAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardAssignment | undefined {
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

  save(item: RewardAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardAssignment[] {
    return this.inner.list();
  }
}

export function newCachedRewardAssignmentStore(inner: RewardAssignmentStore, ttl: number, clockValue: clock.Clock): RewardAssignmentStore {
  return new CachedRewardAssignmentStore(inner, cache.newTtlCache<RewardAssignment>(256, ttl, clockValue), 0, 0);
}

/** Selects reward assignments. Empty fields match all. */
export class RewardAssignmentQuery {
  unit: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minRetries: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardAssignment): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardAssignment[]): RewardAssignment[] {
    const matched = collections.filter(items, (candidate: RewardAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardAssignments(store: RewardAssignmentStore, query: RewardAssignmentQuery): RewardAssignment[] {
  return query.apply(store.list());
}
