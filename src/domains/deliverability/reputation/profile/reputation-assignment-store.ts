import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationAssignment } from "./reputation-assignment.js";

/** Keeps reputation assignments by code. */
export interface ReputationAssignmentStore {
  find(code: string): ReputationAssignment | undefined;
  save(item: ReputationAssignment): void;
  remove(code: string): boolean;
  list(): ReputationAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationAssignmentStore implements ReputationAssignmentStore {
  items: Map<string, ReputationAssignment>;
  order: string[];

  constructor(items: Map<string, ReputationAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationAssignment): void {
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

  list(): ReputationAssignment[] {
    const out: ReputationAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationAssignmentStore(): ReputationAssignmentStore {
  return new MemoryReputationAssignmentStore(new Map<string, ReputationAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationAssignmentStore implements ReputationAssignmentStore {
  inner: ReputationAssignmentStore;
  cache: cache.TtlCache<ReputationAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationAssignmentStore,
    cacheValue: cache.TtlCache<ReputationAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationAssignment | undefined {
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

  save(item: ReputationAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationAssignment[] {
    return this.inner.list();
  }
}

export function newCachedReputationAssignmentStore(inner: ReputationAssignmentStore, ttl: number, clockValue: clock.Clock): ReputationAssignmentStore {
  return new CachedReputationAssignmentStore(
    inner,
    cache.newTtlCache<ReputationAssignment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects reputation assignments. Empty fields match all. */
export class ReputationAssignmentQuery {
  locale: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBid: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationAssignment): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationAssignment[]): ReputationAssignment[] {
    const matched = collections.filter(items, (candidate: ReputationAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationAssignments(store: ReputationAssignmentStore, query: ReputationAssignmentQuery): ReputationAssignment[] {
  return query.apply(store.list());
}
