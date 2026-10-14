import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedOptOutAssignment } from "./capped-opt-out-assignment.js";

/** Keeps capped opt out assignments by code. */
export interface CappedOptOutAssignmentStore {
  find(code: string): CappedOptOutAssignment | undefined;
  save(item: CappedOptOutAssignment): void;
  remove(code: string): boolean;
  list(): CappedOptOutAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedOptOutAssignmentStore implements CappedOptOutAssignmentStore {
  items: Map<string, CappedOptOutAssignment>;
  order: string[];

  constructor(items: Map<string, CappedOptOutAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedOptOutAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedOptOutAssignment): void {
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

  list(): CappedOptOutAssignment[] {
    const out: CappedOptOutAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedOptOutAssignmentStore(): CappedOptOutAssignmentStore {
  return new MemoryCappedOptOutAssignmentStore(new Map<string, CappedOptOutAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedOptOutAssignmentStore implements CappedOptOutAssignmentStore {
  inner: CappedOptOutAssignmentStore;
  cache: cache.TtlCache<CappedOptOutAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedOptOutAssignmentStore,
    cacheValue: cache.TtlCache<CappedOptOutAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedOptOutAssignment | undefined {
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

  save(item: CappedOptOutAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedOptOutAssignment[] {
    return this.inner.list();
  }
}

export function newCachedCappedOptOutAssignmentStore(inner: CappedOptOutAssignmentStore, ttl: number, clockValue: clock.Clock): CappedOptOutAssignmentStore {
  return new CachedCappedOptOutAssignmentStore(
    inner,
    cache.newTtlCache<CappedOptOutAssignment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped opt out assignments. Empty fields match all. */
export class CappedOptOutAssignmentQuery {
  title: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minEndsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedOptOutAssignment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedOptOutAssignment[]): CappedOptOutAssignment[] {
    const matched = collections.filter(items, (candidate: CappedOptOutAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedOptOutAssignments(store: CappedOptOutAssignmentStore, query: CappedOptOutAssignmentQuery): CappedOptOutAssignment[] {
  return query.apply(store.list());
}
