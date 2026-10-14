import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelAssignment } from "./funnel-assignment.js";

/** Keeps funnel assignments by code. */
export interface FunnelAssignmentStore {
  find(code: string): FunnelAssignment | undefined;
  save(item: FunnelAssignment): void;
  remove(code: string): boolean;
  list(): FunnelAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelAssignmentStore implements FunnelAssignmentStore {
  items: Map<string, FunnelAssignment>;
  order: string[];

  constructor(items: Map<string, FunnelAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelAssignment): void {
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

  list(): FunnelAssignment[] {
    const out: FunnelAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelAssignmentStore(): FunnelAssignmentStore {
  return new MemoryFunnelAssignmentStore(new Map<string, FunnelAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelAssignmentStore implements FunnelAssignmentStore {
  inner: FunnelAssignmentStore;
  cache: cache.TtlCache<FunnelAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: FunnelAssignmentStore,
    cacheValue: cache.TtlCache<FunnelAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelAssignment | undefined {
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

  save(item: FunnelAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelAssignment[] {
    return this.inner.list();
  }
}

export function newCachedFunnelAssignmentStore(inner: FunnelAssignmentStore, ttl: number, clockValue: clock.Clock): FunnelAssignmentStore {
  return new CachedFunnelAssignmentStore(inner, cache.newTtlCache<FunnelAssignment>(128, ttl, clockValue), 0, 0);
}

/** Selects funnel assignments. Empty fields match all. */
export class FunnelAssignmentQuery {
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

  matches(item: FunnelAssignment): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelAssignment[]): FunnelAssignment[] {
    const matched = collections.filter(items, (candidate: FunnelAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelAssignments(store: FunnelAssignmentStore, query: FunnelAssignmentQuery): FunnelAssignment[] {
  return query.apply(store.list());
}
