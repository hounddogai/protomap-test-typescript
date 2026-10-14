import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { JourneyAssignment } from "./journey-assignment.js";

/** Keeps journey assignments by code. */
export interface JourneyAssignmentStore {
  find(code: string): JourneyAssignment | undefined;
  save(item: JourneyAssignment): void;
  remove(code: string): boolean;
  list(): JourneyAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryJourneyAssignmentStore implements JourneyAssignmentStore {
  items: Map<string, JourneyAssignment>;
  order: string[];

  constructor(items: Map<string, JourneyAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): JourneyAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: JourneyAssignment): void {
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

  list(): JourneyAssignment[] {
    const out: JourneyAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryJourneyAssignmentStore(): JourneyAssignmentStore {
  return new MemoryJourneyAssignmentStore(new Map<string, JourneyAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedJourneyAssignmentStore implements JourneyAssignmentStore {
  inner: JourneyAssignmentStore;
  cache: cache.TtlCache<JourneyAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: JourneyAssignmentStore,
    cacheValue: cache.TtlCache<JourneyAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): JourneyAssignment | undefined {
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

  save(item: JourneyAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): JourneyAssignment[] {
    return this.inner.list();
  }
}

export function newCachedJourneyAssignmentStore(inner: JourneyAssignmentStore, ttl: number, clockValue: clock.Clock): JourneyAssignmentStore {
  return new CachedJourneyAssignmentStore(inner, cache.newTtlCache<JourneyAssignment>(64, ttl, clockValue), 0, 0);
}

/** Selects journey assignments. Empty fields match all. */
export class JourneyAssignmentQuery {
  country: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minRetries: number, statuses: string[], limit: number) {
    this.country = country;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: JourneyAssignment): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: JourneyAssignment[]): JourneyAssignment[] {
    const matched = collections.filter(items, (candidate: JourneyAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findJourneyAssignments(store: JourneyAssignmentStore, query: JourneyAssignmentQuery): JourneyAssignment[] {
  return query.apply(store.list());
}
