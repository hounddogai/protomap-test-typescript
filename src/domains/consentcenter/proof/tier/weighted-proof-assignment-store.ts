import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedProofAssignment } from "./weighted-proof-assignment.js";

/** Keeps weighted proof assignments by code. */
export interface WeightedProofAssignmentStore {
  find(code: string): WeightedProofAssignment | undefined;
  save(item: WeightedProofAssignment): void;
  remove(code: string): boolean;
  list(): WeightedProofAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedProofAssignmentStore implements WeightedProofAssignmentStore {
  items: Map<string, WeightedProofAssignment>;
  order: string[];

  constructor(items: Map<string, WeightedProofAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedProofAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedProofAssignment): void {
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

  list(): WeightedProofAssignment[] {
    const out: WeightedProofAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedProofAssignmentStore(): WeightedProofAssignmentStore {
  return new MemoryWeightedProofAssignmentStore(new Map<string, WeightedProofAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedProofAssignmentStore implements WeightedProofAssignmentStore {
  inner: WeightedProofAssignmentStore;
  cache: cache.TtlCache<WeightedProofAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedProofAssignmentStore,
    cacheValue: cache.TtlCache<WeightedProofAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedProofAssignment | undefined {
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

  save(item: WeightedProofAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedProofAssignment[] {
    return this.inner.list();
  }
}

export function newCachedWeightedProofAssignmentStore(inner: WeightedProofAssignmentStore, ttl: number, clockValue: clock.Clock): WeightedProofAssignmentStore {
  return new CachedWeightedProofAssignmentStore(
    inner,
    cache.newTtlCache<WeightedProofAssignment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted proof assignments. Empty fields match all. */
export class WeightedProofAssignmentQuery {
  source: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minBudget: number, statuses: string[], limit: number) {
    this.source = source;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedProofAssignment): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedProofAssignment[]): WeightedProofAssignment[] {
    const matched = collections.filter(items, (candidate: WeightedProofAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedProofAssignments(store: WeightedProofAssignmentStore, query: WeightedProofAssignmentQuery): WeightedProofAssignment[] {
  return query.apply(store.list());
}
