import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchAssignment } from "./branch-assignment.js";

/** Keeps branch assignments by code. */
export interface BranchAssignmentStore {
  find(code: string): BranchAssignment | undefined;
  save(item: BranchAssignment): void;
  remove(code: string): boolean;
  list(): BranchAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchAssignmentStore implements BranchAssignmentStore {
  items: Map<string, BranchAssignment>;
  order: string[];

  constructor(items: Map<string, BranchAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchAssignment): void {
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

  list(): BranchAssignment[] {
    const out: BranchAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchAssignmentStore(): BranchAssignmentStore {
  return new MemoryBranchAssignmentStore(new Map<string, BranchAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchAssignmentStore implements BranchAssignmentStore {
  inner: BranchAssignmentStore;
  cache: cache.TtlCache<BranchAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: BranchAssignmentStore,
    cacheValue: cache.TtlCache<BranchAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchAssignment | undefined {
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

  save(item: BranchAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchAssignment[] {
    return this.inner.list();
  }
}

export function newCachedBranchAssignmentStore(inner: BranchAssignmentStore, ttl: number, clockValue: clock.Clock): BranchAssignmentStore {
  return new CachedBranchAssignmentStore(inner, cache.newTtlCache<BranchAssignment>(256, ttl, clockValue), 0, 0);
}

/** Selects branch assignments. Empty fields match all. */
export class BranchAssignmentQuery {
  channel: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minClicks: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchAssignment): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchAssignment[]): BranchAssignment[] {
    const matched = collections.filter(items, (candidate: BranchAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchAssignments(store: BranchAssignmentStore, query: BranchAssignmentQuery): BranchAssignment[] {
  return query.apply(store.list());
}
