import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientModelAssignment } from "./lenient-model-assignment.js";

/** Keeps lenient model assignments by code. */
export interface LenientModelAssignmentStore {
  find(code: string): LenientModelAssignment | undefined;
  save(item: LenientModelAssignment): void;
  remove(code: string): boolean;
  list(): LenientModelAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientModelAssignmentStore implements LenientModelAssignmentStore {
  items: Map<string, LenientModelAssignment>;
  order: string[];

  constructor(items: Map<string, LenientModelAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientModelAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientModelAssignment): void {
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

  list(): LenientModelAssignment[] {
    const out: LenientModelAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientModelAssignmentStore(): LenientModelAssignmentStore {
  return new MemoryLenientModelAssignmentStore(new Map<string, LenientModelAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientModelAssignmentStore implements LenientModelAssignmentStore {
  inner: LenientModelAssignmentStore;
  cache: cache.TtlCache<LenientModelAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientModelAssignmentStore,
    cacheValue: cache.TtlCache<LenientModelAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientModelAssignment | undefined {
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

  save(item: LenientModelAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientModelAssignment[] {
    return this.inner.list();
  }
}

export function newCachedLenientModelAssignmentStore(inner: LenientModelAssignmentStore, ttl: number, clockValue: clock.Clock): LenientModelAssignmentStore {
  return new CachedLenientModelAssignmentStore(
    inner,
    cache.newTtlCache<LenientModelAssignment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient model assignments. Empty fields match all. */
export class LenientModelAssignmentQuery {
  name: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBid: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientModelAssignment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientModelAssignment[]): LenientModelAssignment[] {
    const matched = collections.filter(items, (candidate: LenientModelAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientModelAssignments(store: LenientModelAssignmentStore, query: LenientModelAssignmentQuery): LenientModelAssignment[] {
  return query.apply(store.list());
}
