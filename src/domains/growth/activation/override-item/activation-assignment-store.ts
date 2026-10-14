import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationAssignment } from "./activation-assignment.js";

/** Keeps activation assignments by code. */
export interface ActivationAssignmentStore {
  find(code: string): ActivationAssignment | undefined;
  save(item: ActivationAssignment): void;
  remove(code: string): boolean;
  list(): ActivationAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationAssignmentStore implements ActivationAssignmentStore {
  items: Map<string, ActivationAssignment>;
  order: string[];

  constructor(items: Map<string, ActivationAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationAssignment): void {
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

  list(): ActivationAssignment[] {
    const out: ActivationAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationAssignmentStore(): ActivationAssignmentStore {
  return new MemoryActivationAssignmentStore(new Map<string, ActivationAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationAssignmentStore implements ActivationAssignmentStore {
  inner: ActivationAssignmentStore;
  cache: cache.TtlCache<ActivationAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationAssignmentStore,
    cacheValue: cache.TtlCache<ActivationAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationAssignment | undefined {
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

  save(item: ActivationAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationAssignment[] {
    return this.inner.list();
  }
}

export function newCachedActivationAssignmentStore(inner: ActivationAssignmentStore, ttl: number, clockValue: clock.Clock): ActivationAssignmentStore {
  return new CachedActivationAssignmentStore(inner, cache.newTtlCache<ActivationAssignment>(64, ttl, clockValue), 0, 0);
}

/** Selects activation assignments. Empty fields match all. */
export class ActivationAssignmentQuery {
  name: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAmount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ActivationAssignment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationAssignment[]): ActivationAssignment[] {
    const matched = collections.filter(items, (candidate: ActivationAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationAssignments(store: ActivationAssignmentStore, query: ActivationAssignmentQuery): ActivationAssignment[] {
  return query.apply(store.list());
}
