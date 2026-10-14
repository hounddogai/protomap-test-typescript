import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingStepAssignment } from "./rolling-step-assignment.js";

/** Keeps rolling step assignments by code. */
export interface RollingStepAssignmentStore {
  find(code: string): RollingStepAssignment | undefined;
  save(item: RollingStepAssignment): void;
  remove(code: string): boolean;
  list(): RollingStepAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingStepAssignmentStore implements RollingStepAssignmentStore {
  items: Map<string, RollingStepAssignment>;
  order: string[];

  constructor(items: Map<string, RollingStepAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingStepAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingStepAssignment): void {
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

  list(): RollingStepAssignment[] {
    const out: RollingStepAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingStepAssignmentStore(): RollingStepAssignmentStore {
  return new MemoryRollingStepAssignmentStore(new Map<string, RollingStepAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingStepAssignmentStore implements RollingStepAssignmentStore {
  inner: RollingStepAssignmentStore;
  cache: cache.TtlCache<RollingStepAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingStepAssignmentStore,
    cacheValue: cache.TtlCache<RollingStepAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingStepAssignment | undefined {
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

  save(item: RollingStepAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingStepAssignment[] {
    return this.inner.list();
  }
}

export function newCachedRollingStepAssignmentStore(inner: RollingStepAssignmentStore, ttl: number, clockValue: clock.Clock): RollingStepAssignmentStore {
  return new CachedRollingStepAssignmentStore(
    inner,
    cache.newTtlCache<RollingStepAssignment>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling step assignments. Empty fields match all. */
export class RollingStepAssignmentQuery {
  title: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minScore: number, statuses: string[], limit: number) {
    this.title = title;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingStepAssignment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingStepAssignment[]): RollingStepAssignment[] {
    const matched = collections.filter(items, (candidate: RollingStepAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingStepAssignments(store: RollingStepAssignmentStore, query: RollingStepAssignmentQuery): RollingStepAssignment[] {
  return query.apply(store.list());
}
