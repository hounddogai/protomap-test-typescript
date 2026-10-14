import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightAssignment } from "./flight-assignment.js";

/** Keeps flight assignments by code. */
export interface FlightAssignmentStore {
  find(code: string): FlightAssignment | undefined;
  save(item: FlightAssignment): void;
  remove(code: string): boolean;
  list(): FlightAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightAssignmentStore implements FlightAssignmentStore {
  items: Map<string, FlightAssignment>;
  order: string[];

  constructor(items: Map<string, FlightAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightAssignment): void {
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

  list(): FlightAssignment[] {
    const out: FlightAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightAssignmentStore(): FlightAssignmentStore {
  return new MemoryFlightAssignmentStore(new Map<string, FlightAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightAssignmentStore implements FlightAssignmentStore {
  inner: FlightAssignmentStore;
  cache: cache.TtlCache<FlightAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: FlightAssignmentStore,
    cacheValue: cache.TtlCache<FlightAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightAssignment | undefined {
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

  save(item: FlightAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightAssignment[] {
    return this.inner.list();
  }
}

export function newCachedFlightAssignmentStore(inner: FlightAssignmentStore, ttl: number, clockValue: clock.Clock): FlightAssignmentStore {
  return new CachedFlightAssignmentStore(inner, cache.newTtlCache<FlightAssignment>(128, ttl, clockValue), 0, 0);
}

/** Selects flight assignments. Empty fields match all. */
export class FlightAssignmentQuery {
  title: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBudget: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightAssignment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightAssignment[]): FlightAssignment[] {
    const matched = collections.filter(items, (candidate: FlightAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightAssignments(store: FlightAssignmentStore, query: FlightAssignmentQuery): FlightAssignment[] {
  return query.apply(store.list());
}
