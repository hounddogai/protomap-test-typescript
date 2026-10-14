import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalAssignment } from "./approval-assignment.js";

/** Keeps approval assignments by code. */
export interface ApprovalAssignmentStore {
  find(code: string): ApprovalAssignment | undefined;
  save(item: ApprovalAssignment): void;
  remove(code: string): boolean;
  list(): ApprovalAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalAssignmentStore implements ApprovalAssignmentStore {
  items: Map<string, ApprovalAssignment>;
  order: string[];

  constructor(items: Map<string, ApprovalAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalAssignment): void {
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

  list(): ApprovalAssignment[] {
    const out: ApprovalAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalAssignmentStore(): ApprovalAssignmentStore {
  return new MemoryApprovalAssignmentStore(new Map<string, ApprovalAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalAssignmentStore implements ApprovalAssignmentStore {
  inner: ApprovalAssignmentStore;
  cache: cache.TtlCache<ApprovalAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalAssignmentStore,
    cacheValue: cache.TtlCache<ApprovalAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalAssignment | undefined {
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

  save(item: ApprovalAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalAssignment[] {
    return this.inner.list();
  }
}

export function newCachedApprovalAssignmentStore(inner: ApprovalAssignmentStore, ttl: number, clockValue: clock.Clock): ApprovalAssignmentStore {
  return new CachedApprovalAssignmentStore(inner, cache.newTtlCache<ApprovalAssignment>(1024, ttl, clockValue), 0, 0);
}

/** Selects approval assignments. Empty fields match all. */
export class ApprovalAssignmentQuery {
  region: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minRetries: number, statuses: string[], limit: number) {
    this.region = region;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalAssignment): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalAssignment[]): ApprovalAssignment[] {
    const matched = collections.filter(items, (candidate: ApprovalAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalAssignments(store: ApprovalAssignmentStore, query: ApprovalAssignmentQuery): ApprovalAssignment[] {
  return query.apply(store.list());
}
