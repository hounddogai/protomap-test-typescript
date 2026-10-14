import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleAssignment } from "./exit-rule-assignment.js";

/** Keeps exit rule assignments by code. */
export interface ExitRuleAssignmentStore {
  find(code: string): ExitRuleAssignment | undefined;
  save(item: ExitRuleAssignment): void;
  remove(code: string): boolean;
  list(): ExitRuleAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleAssignmentStore implements ExitRuleAssignmentStore {
  items: Map<string, ExitRuleAssignment>;
  order: string[];

  constructor(items: Map<string, ExitRuleAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleAssignment): void {
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

  list(): ExitRuleAssignment[] {
    const out: ExitRuleAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleAssignmentStore(): ExitRuleAssignmentStore {
  return new MemoryExitRuleAssignmentStore(new Map<string, ExitRuleAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleAssignmentStore implements ExitRuleAssignmentStore {
  inner: ExitRuleAssignmentStore;
  cache: cache.TtlCache<ExitRuleAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: ExitRuleAssignmentStore,
    cacheValue: cache.TtlCache<ExitRuleAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleAssignment | undefined {
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

  save(item: ExitRuleAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleAssignment[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleAssignmentStore(inner: ExitRuleAssignmentStore, ttl: number, clockValue: clock.Clock): ExitRuleAssignmentStore {
  return new CachedExitRuleAssignmentStore(inner, cache.newTtlCache<ExitRuleAssignment>(512, ttl, clockValue), 0, 0);
}

/** Selects exit rule assignments. Empty fields match all. */
export class ExitRuleAssignmentQuery {
  title: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minFloorValue: number, statuses: string[], limit: number) {
    this.title = title;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleAssignment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleAssignment[]): ExitRuleAssignment[] {
    const matched = collections.filter(items, (candidate: ExitRuleAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleAssignments(store: ExitRuleAssignmentStore, query: ExitRuleAssignmentQuery): ExitRuleAssignment[] {
  return query.apply(store.list());
}
