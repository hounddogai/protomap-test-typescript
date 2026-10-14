import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryProofAssignment } from "./primary-proof-assignment.js";

/** Keeps primary proof assignments by code. */
export interface PrimaryProofAssignmentStore {
  find(code: string): PrimaryProofAssignment | undefined;
  save(item: PrimaryProofAssignment): void;
  remove(code: string): boolean;
  list(): PrimaryProofAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryProofAssignmentStore implements PrimaryProofAssignmentStore {
  items: Map<string, PrimaryProofAssignment>;
  order: string[];

  constructor(items: Map<string, PrimaryProofAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryProofAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryProofAssignment): void {
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

  list(): PrimaryProofAssignment[] {
    const out: PrimaryProofAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryProofAssignmentStore(): PrimaryProofAssignmentStore {
  return new MemoryPrimaryProofAssignmentStore(new Map<string, PrimaryProofAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryProofAssignmentStore implements PrimaryProofAssignmentStore {
  inner: PrimaryProofAssignmentStore;
  cache: cache.TtlCache<PrimaryProofAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryProofAssignmentStore,
    cacheValue: cache.TtlCache<PrimaryProofAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryProofAssignment | undefined {
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

  save(item: PrimaryProofAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryProofAssignment[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryProofAssignmentStore(inner: PrimaryProofAssignmentStore, ttl: number, clockValue: clock.Clock): PrimaryProofAssignmentStore {
  return new CachedPrimaryProofAssignmentStore(
    inner,
    cache.newTtlCache<PrimaryProofAssignment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary proof assignments. Empty fields match all. */
export class PrimaryProofAssignmentQuery {
  unit: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minGraceDays: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryProofAssignment): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryProofAssignment[]): PrimaryProofAssignment[] {
    const matched = collections.filter(items, (candidate: PrimaryProofAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryProofAssignments(store: PrimaryProofAssignmentStore, query: PrimaryProofAssignmentQuery): PrimaryProofAssignment[] {
  return query.apply(store.list());
}
