import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionAssignment } from "./suppression-assignment.js";

/** Keeps suppression assignments by code. */
export interface SuppressionAssignmentStore {
  find(code: string): SuppressionAssignment | undefined;
  save(item: SuppressionAssignment): void;
  remove(code: string): boolean;
  list(): SuppressionAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionAssignmentStore implements SuppressionAssignmentStore {
  items: Map<string, SuppressionAssignment>;
  order: string[];

  constructor(items: Map<string, SuppressionAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionAssignment): void {
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

  list(): SuppressionAssignment[] {
    const out: SuppressionAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionAssignmentStore(): SuppressionAssignmentStore {
  return new MemorySuppressionAssignmentStore(new Map<string, SuppressionAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionAssignmentStore implements SuppressionAssignmentStore {
  inner: SuppressionAssignmentStore;
  cache: cache.TtlCache<SuppressionAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionAssignmentStore,
    cacheValue: cache.TtlCache<SuppressionAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionAssignment | undefined {
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

  save(item: SuppressionAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionAssignment[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionAssignmentStore(inner: SuppressionAssignmentStore, ttl: number, clockValue: clock.Clock): SuppressionAssignmentStore {
  return new CachedSuppressionAssignmentStore(
    inner,
    cache.newTtlCache<SuppressionAssignment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects suppression assignments. Empty fields match all. */
export class SuppressionAssignmentQuery {
  locale: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minWeight: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionAssignment): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionAssignment[]): SuppressionAssignment[] {
    const matched = collections.filter(items, (candidate: SuppressionAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionAssignments(store: SuppressionAssignmentStore, query: SuppressionAssignmentQuery): SuppressionAssignment[] {
  return query.apply(store.list());
}
