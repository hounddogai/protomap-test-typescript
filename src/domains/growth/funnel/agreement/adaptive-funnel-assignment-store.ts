import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveFunnelAssignment } from "./adaptive-funnel-assignment.js";

/** Keeps adaptive funnel assignments by code. */
export interface AdaptiveFunnelAssignmentStore {
  find(code: string): AdaptiveFunnelAssignment | undefined;
  save(item: AdaptiveFunnelAssignment): void;
  remove(code: string): boolean;
  list(): AdaptiveFunnelAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveFunnelAssignmentStore implements AdaptiveFunnelAssignmentStore {
  items: Map<string, AdaptiveFunnelAssignment>;
  order: string[];

  constructor(items: Map<string, AdaptiveFunnelAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveFunnelAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveFunnelAssignment): void {
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

  list(): AdaptiveFunnelAssignment[] {
    const out: AdaptiveFunnelAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveFunnelAssignmentStore(): AdaptiveFunnelAssignmentStore {
  return new MemoryAdaptiveFunnelAssignmentStore(new Map<string, AdaptiveFunnelAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveFunnelAssignmentStore implements AdaptiveFunnelAssignmentStore {
  inner: AdaptiveFunnelAssignmentStore;
  cache: cache.TtlCache<AdaptiveFunnelAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveFunnelAssignmentStore,
    cacheValue: cache.TtlCache<AdaptiveFunnelAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveFunnelAssignment | undefined {
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

  save(item: AdaptiveFunnelAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveFunnelAssignment[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveFunnelAssignmentStore(inner: AdaptiveFunnelAssignmentStore, ttl: number, clockValue: clock.Clock): AdaptiveFunnelAssignmentStore {
  return new CachedAdaptiveFunnelAssignmentStore(
    inner,
    cache.newTtlCache<AdaptiveFunnelAssignment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive funnel assignments. Empty fields match all. */
export class AdaptiveFunnelAssignmentQuery {
  unit: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minScore: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveFunnelAssignment): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveFunnelAssignment[]): AdaptiveFunnelAssignment[] {
    const matched = collections.filter(items, (candidate: AdaptiveFunnelAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveFunnelAssignments(store: AdaptiveFunnelAssignmentStore, query: AdaptiveFunnelAssignmentQuery): AdaptiveFunnelAssignment[] {
  return query.apply(store.list());
}
