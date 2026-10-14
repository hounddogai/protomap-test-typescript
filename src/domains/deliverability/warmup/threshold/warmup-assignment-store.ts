import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupAssignment } from "./warmup-assignment.js";

/** Keeps warmup assignments by code. */
export interface WarmupAssignmentStore {
  find(code: string): WarmupAssignment | undefined;
  save(item: WarmupAssignment): void;
  remove(code: string): boolean;
  list(): WarmupAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupAssignmentStore implements WarmupAssignmentStore {
  items: Map<string, WarmupAssignment>;
  order: string[];

  constructor(items: Map<string, WarmupAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupAssignment): void {
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

  list(): WarmupAssignment[] {
    const out: WarmupAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupAssignmentStore(): WarmupAssignmentStore {
  return new MemoryWarmupAssignmentStore(new Map<string, WarmupAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupAssignmentStore implements WarmupAssignmentStore {
  inner: WarmupAssignmentStore;
  cache: cache.TtlCache<WarmupAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: WarmupAssignmentStore,
    cacheValue: cache.TtlCache<WarmupAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupAssignment | undefined {
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

  save(item: WarmupAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupAssignment[] {
    return this.inner.list();
  }
}

export function newCachedWarmupAssignmentStore(inner: WarmupAssignmentStore, ttl: number, clockValue: clock.Clock): WarmupAssignmentStore {
  return new CachedWarmupAssignmentStore(inner, cache.newTtlCache<WarmupAssignment>(128, ttl, clockValue), 0, 0);
}

/** Selects warmup assignments. Empty fields match all. */
export class WarmupAssignmentQuery {
  region: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupAssignment): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupAssignment[]): WarmupAssignment[] {
    const matched = collections.filter(items, (candidate: WarmupAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupAssignments(store: WarmupAssignmentStore, query: WarmupAssignmentQuery): WarmupAssignment[] {
  return query.apply(store.list());
}
