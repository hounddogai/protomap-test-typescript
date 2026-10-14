import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacySenderAssignment } from "./legacy-sender-assignment.js";

/** Keeps legacy sender assignments by code. */
export interface LegacySenderAssignmentStore {
  find(code: string): LegacySenderAssignment | undefined;
  save(item: LegacySenderAssignment): void;
  remove(code: string): boolean;
  list(): LegacySenderAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacySenderAssignmentStore implements LegacySenderAssignmentStore {
  items: Map<string, LegacySenderAssignment>;
  order: string[];

  constructor(items: Map<string, LegacySenderAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacySenderAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacySenderAssignment): void {
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

  list(): LegacySenderAssignment[] {
    const out: LegacySenderAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacySenderAssignmentStore(): LegacySenderAssignmentStore {
  return new MemoryLegacySenderAssignmentStore(new Map<string, LegacySenderAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacySenderAssignmentStore implements LegacySenderAssignmentStore {
  inner: LegacySenderAssignmentStore;
  cache: cache.TtlCache<LegacySenderAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacySenderAssignmentStore,
    cacheValue: cache.TtlCache<LegacySenderAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacySenderAssignment | undefined {
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

  save(item: LegacySenderAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacySenderAssignment[] {
    return this.inner.list();
  }
}

export function newCachedLegacySenderAssignmentStore(inner: LegacySenderAssignmentStore, ttl: number, clockValue: clock.Clock): LegacySenderAssignmentStore {
  return new CachedLegacySenderAssignmentStore(
    inner,
    cache.newTtlCache<LegacySenderAssignment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy sender assignments. Empty fields match all. */
export class LegacySenderAssignmentQuery {
  segment: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minSequence: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacySenderAssignment): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacySenderAssignment[]): LegacySenderAssignment[] {
    const matched = collections.filter(items, (candidate: LegacySenderAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacySenderAssignments(store: LegacySenderAssignmentStore, query: LegacySenderAssignmentQuery): LegacySenderAssignment[] {
  return query.apply(store.list());
}
