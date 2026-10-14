import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredReputationAssignment } from "./tiered-reputation-assignment.js";

/** Keeps tiered reputation assignments by code. */
export interface TieredReputationAssignmentStore {
  find(code: string): TieredReputationAssignment | undefined;
  save(item: TieredReputationAssignment): void;
  remove(code: string): boolean;
  list(): TieredReputationAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredReputationAssignmentStore implements TieredReputationAssignmentStore {
  items: Map<string, TieredReputationAssignment>;
  order: string[];

  constructor(items: Map<string, TieredReputationAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredReputationAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredReputationAssignment): void {
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

  list(): TieredReputationAssignment[] {
    const out: TieredReputationAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredReputationAssignmentStore(): TieredReputationAssignmentStore {
  return new MemoryTieredReputationAssignmentStore(new Map<string, TieredReputationAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredReputationAssignmentStore implements TieredReputationAssignmentStore {
  inner: TieredReputationAssignmentStore;
  cache: cache.TtlCache<TieredReputationAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredReputationAssignmentStore,
    cacheValue: cache.TtlCache<TieredReputationAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredReputationAssignment | undefined {
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

  save(item: TieredReputationAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredReputationAssignment[] {
    return this.inner.list();
  }
}

export function newCachedTieredReputationAssignmentStore(inner: TieredReputationAssignmentStore, ttl: number, clockValue: clock.Clock): TieredReputationAssignmentStore {
  return new CachedTieredReputationAssignmentStore(
    inner,
    cache.newTtlCache<TieredReputationAssignment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered reputation assignments. Empty fields match all. */
export class TieredReputationAssignmentQuery {
  region: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCapacity: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredReputationAssignment): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredReputationAssignment[]): TieredReputationAssignment[] {
    const matched = collections.filter(items, (candidate: TieredReputationAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredReputationAssignments(store: TieredReputationAssignmentStore, query: TieredReputationAssignmentQuery): TieredReputationAssignment[] {
  return query.apply(store.list());
}
