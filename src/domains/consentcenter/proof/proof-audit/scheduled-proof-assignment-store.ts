import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledProofAssignment } from "./scheduled-proof-assignment.js";

/** Keeps scheduled proof assignments by code. */
export interface ScheduledProofAssignmentStore {
  find(code: string): ScheduledProofAssignment | undefined;
  save(item: ScheduledProofAssignment): void;
  remove(code: string): boolean;
  list(): ScheduledProofAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledProofAssignmentStore implements ScheduledProofAssignmentStore {
  items: Map<string, ScheduledProofAssignment>;
  order: string[];

  constructor(items: Map<string, ScheduledProofAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledProofAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledProofAssignment): void {
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

  list(): ScheduledProofAssignment[] {
    const out: ScheduledProofAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledProofAssignmentStore(): ScheduledProofAssignmentStore {
  return new MemoryScheduledProofAssignmentStore(new Map<string, ScheduledProofAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledProofAssignmentStore implements ScheduledProofAssignmentStore {
  inner: ScheduledProofAssignmentStore;
  cache: cache.TtlCache<ScheduledProofAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledProofAssignmentStore,
    cacheValue: cache.TtlCache<ScheduledProofAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledProofAssignment | undefined {
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

  save(item: ScheduledProofAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledProofAssignment[] {
    return this.inner.list();
  }
}

export function newCachedScheduledProofAssignmentStore(inner: ScheduledProofAssignmentStore, ttl: number, clockValue: clock.Clock): ScheduledProofAssignmentStore {
  return new CachedScheduledProofAssignmentStore(
    inner,
    cache.newTtlCache<ScheduledProofAssignment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled proof assignments. Empty fields match all. */
export class ScheduledProofAssignmentQuery {
  source: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRetries: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledProofAssignment): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledProofAssignment[]): ScheduledProofAssignment[] {
    const matched = collections.filter(items, (candidate: ScheduledProofAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledProofAssignments(store: ScheduledProofAssignmentStore, query: ScheduledProofAssignmentQuery): ScheduledProofAssignment[] {
  return query.apply(store.list());
}
