import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictCohortAssignment } from "./strict-cohort-assignment.js";

/** Keeps strict cohort assignments by code. */
export interface StrictCohortAssignmentStore {
  find(code: string): StrictCohortAssignment | undefined;
  save(item: StrictCohortAssignment): void;
  remove(code: string): boolean;
  list(): StrictCohortAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictCohortAssignmentStore implements StrictCohortAssignmentStore {
  items: Map<string, StrictCohortAssignment>;
  order: string[];

  constructor(items: Map<string, StrictCohortAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictCohortAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictCohortAssignment): void {
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

  list(): StrictCohortAssignment[] {
    const out: StrictCohortAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictCohortAssignmentStore(): StrictCohortAssignmentStore {
  return new MemoryStrictCohortAssignmentStore(new Map<string, StrictCohortAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictCohortAssignmentStore implements StrictCohortAssignmentStore {
  inner: StrictCohortAssignmentStore;
  cache: cache.TtlCache<StrictCohortAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictCohortAssignmentStore,
    cacheValue: cache.TtlCache<StrictCohortAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictCohortAssignment | undefined {
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

  save(item: StrictCohortAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictCohortAssignment[] {
    return this.inner.list();
  }
}

export function newCachedStrictCohortAssignmentStore(inner: StrictCohortAssignmentStore, ttl: number, clockValue: clock.Clock): StrictCohortAssignmentStore {
  return new CachedStrictCohortAssignmentStore(
    inner,
    cache.newTtlCache<StrictCohortAssignment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict cohort assignments. Empty fields match all. */
export class StrictCohortAssignmentQuery {
  locale: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRetries: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictCohortAssignment): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictCohortAssignment[]): StrictCohortAssignment[] {
    const matched = collections.filter(items, (candidate: StrictCohortAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictCohortAssignments(store: StrictCohortAssignmentStore, query: StrictCohortAssignmentQuery): StrictCohortAssignment[] {
  return query.apply(store.list());
}
