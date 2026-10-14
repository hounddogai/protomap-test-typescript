import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StepAssignment } from "./step-assignment.js";

/** Keeps step assignments by code. */
export interface StepAssignmentStore {
  find(code: string): StepAssignment | undefined;
  save(item: StepAssignment): void;
  remove(code: string): boolean;
  list(): StepAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStepAssignmentStore implements StepAssignmentStore {
  items: Map<string, StepAssignment>;
  order: string[];

  constructor(items: Map<string, StepAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StepAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StepAssignment): void {
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

  list(): StepAssignment[] {
    const out: StepAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStepAssignmentStore(): StepAssignmentStore {
  return new MemoryStepAssignmentStore(new Map<string, StepAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStepAssignmentStore implements StepAssignmentStore {
  inner: StepAssignmentStore;
  cache: cache.TtlCache<StepAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: StepAssignmentStore,
    cacheValue: cache.TtlCache<StepAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StepAssignment | undefined {
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

  save(item: StepAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StepAssignment[] {
    return this.inner.list();
  }
}

export function newCachedStepAssignmentStore(inner: StepAssignmentStore, ttl: number, clockValue: clock.Clock): StepAssignmentStore {
  return new CachedStepAssignmentStore(inner, cache.newTtlCache<StepAssignment>(256, ttl, clockValue), 0, 0);
}

/** Selects step assignments. Empty fields match all. */
export class StepAssignmentQuery {
  locale: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StepAssignment): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StepAssignment[]): StepAssignment[] {
    const matched = collections.filter(items, (candidate: StepAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStepAssignments(store: StepAssignmentStore, query: StepAssignmentQuery): StepAssignment[] {
  return query.apply(store.list());
}
