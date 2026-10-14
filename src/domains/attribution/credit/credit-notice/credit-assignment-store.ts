import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditAssignment } from "./credit-assignment.js";

/** Keeps credit assignments by code. */
export interface CreditAssignmentStore {
  find(code: string): CreditAssignment | undefined;
  save(item: CreditAssignment): void;
  remove(code: string): boolean;
  list(): CreditAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditAssignmentStore implements CreditAssignmentStore {
  items: Map<string, CreditAssignment>;
  order: string[];

  constructor(items: Map<string, CreditAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditAssignment): void {
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

  list(): CreditAssignment[] {
    const out: CreditAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditAssignmentStore(): CreditAssignmentStore {
  return new MemoryCreditAssignmentStore(new Map<string, CreditAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditAssignmentStore implements CreditAssignmentStore {
  inner: CreditAssignmentStore;
  cache: cache.TtlCache<CreditAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: CreditAssignmentStore,
    cacheValue: cache.TtlCache<CreditAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditAssignment | undefined {
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

  save(item: CreditAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditAssignment[] {
    return this.inner.list();
  }
}

export function newCachedCreditAssignmentStore(inner: CreditAssignmentStore, ttl: number, clockValue: clock.Clock): CreditAssignmentStore {
  return new CachedCreditAssignmentStore(inner, cache.newTtlCache<CreditAssignment>(256, ttl, clockValue), 0, 0);
}

/** Selects credit assignments. Empty fields match all. */
export class CreditAssignmentQuery {
  title: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditAssignment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditAssignment[]): CreditAssignment[] {
    const matched = collections.filter(items, (candidate: CreditAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditAssignments(store: CreditAssignmentStore, query: CreditAssignmentQuery): CreditAssignment[] {
  return query.apply(store.list());
}
