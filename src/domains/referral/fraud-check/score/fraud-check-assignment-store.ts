import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckAssignment } from "./fraud-check-assignment.js";

/** Keeps fraud check assignments by code. */
export interface FraudCheckAssignmentStore {
  find(code: string): FraudCheckAssignment | undefined;
  save(item: FraudCheckAssignment): void;
  remove(code: string): boolean;
  list(): FraudCheckAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckAssignmentStore implements FraudCheckAssignmentStore {
  items: Map<string, FraudCheckAssignment>;
  order: string[];

  constructor(items: Map<string, FraudCheckAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckAssignment): void {
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

  list(): FraudCheckAssignment[] {
    const out: FraudCheckAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckAssignmentStore(): FraudCheckAssignmentStore {
  return new MemoryFraudCheckAssignmentStore(new Map<string, FraudCheckAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckAssignmentStore implements FraudCheckAssignmentStore {
  inner: FraudCheckAssignmentStore;
  cache: cache.TtlCache<FraudCheckAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckAssignmentStore,
    cacheValue: cache.TtlCache<FraudCheckAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckAssignment | undefined {
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

  save(item: FraudCheckAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckAssignment[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckAssignmentStore(inner: FraudCheckAssignmentStore, ttl: number, clockValue: clock.Clock): FraudCheckAssignmentStore {
  return new CachedFraudCheckAssignmentStore(inner, cache.newTtlCache<FraudCheckAssignment>(64, ttl, clockValue), 0, 0);
}

/** Selects fraud check assignments. Empty fields match all. */
export class FraudCheckAssignmentQuery {
  segment: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minConversionRate: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckAssignment): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckAssignment[]): FraudCheckAssignment[] {
    const matched = collections.filter(items, (candidate: FraudCheckAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckAssignments(store: FraudCheckAssignmentStore, query: FraudCheckAssignmentQuery): FraudCheckAssignment[] {
  return query.apply(store.list());
}
