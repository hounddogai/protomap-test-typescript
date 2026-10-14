import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortAssignment } from "./cohort-assignment.js";

/** Keeps cohort assignments by code. */
export interface CohortAssignmentStore {
  find(code: string): CohortAssignment | undefined;
  save(item: CohortAssignment): void;
  remove(code: string): boolean;
  list(): CohortAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortAssignmentStore implements CohortAssignmentStore {
  items: Map<string, CohortAssignment>;
  order: string[];

  constructor(items: Map<string, CohortAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortAssignment): void {
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

  list(): CohortAssignment[] {
    const out: CohortAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortAssignmentStore(): CohortAssignmentStore {
  return new MemoryCohortAssignmentStore(new Map<string, CohortAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortAssignmentStore implements CohortAssignmentStore {
  inner: CohortAssignmentStore;
  cache: cache.TtlCache<CohortAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: CohortAssignmentStore,
    cacheValue: cache.TtlCache<CohortAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortAssignment | undefined {
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

  save(item: CohortAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortAssignment[] {
    return this.inner.list();
  }
}

export function newCachedCohortAssignmentStore(inner: CohortAssignmentStore, ttl: number, clockValue: clock.Clock): CohortAssignmentStore {
  return new CachedCohortAssignmentStore(inner, cache.newTtlCache<CohortAssignment>(64, ttl, clockValue), 0, 0);
}

/** Selects cohort assignments. Empty fields match all. */
export class CohortAssignmentQuery {
  country: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortAssignment): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortAssignment[]): CohortAssignment[] {
    const matched = collections.filter(items, (candidate: CohortAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortAssignments(store: CohortAssignmentStore, query: CohortAssignmentQuery): CohortAssignment[] {
  return query.apply(store.list());
}
