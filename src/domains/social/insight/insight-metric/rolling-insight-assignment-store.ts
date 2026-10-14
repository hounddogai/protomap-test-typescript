import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingInsightAssignment } from "./rolling-insight-assignment.js";

/** Keeps rolling insight assignments by code. */
export interface RollingInsightAssignmentStore {
  find(code: string): RollingInsightAssignment | undefined;
  save(item: RollingInsightAssignment): void;
  remove(code: string): boolean;
  list(): RollingInsightAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingInsightAssignmentStore implements RollingInsightAssignmentStore {
  items: Map<string, RollingInsightAssignment>;
  order: string[];

  constructor(items: Map<string, RollingInsightAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingInsightAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingInsightAssignment): void {
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

  list(): RollingInsightAssignment[] {
    const out: RollingInsightAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingInsightAssignmentStore(): RollingInsightAssignmentStore {
  return new MemoryRollingInsightAssignmentStore(new Map<string, RollingInsightAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingInsightAssignmentStore implements RollingInsightAssignmentStore {
  inner: RollingInsightAssignmentStore;
  cache: cache.TtlCache<RollingInsightAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingInsightAssignmentStore,
    cacheValue: cache.TtlCache<RollingInsightAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingInsightAssignment | undefined {
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

  save(item: RollingInsightAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingInsightAssignment[] {
    return this.inner.list();
  }
}

export function newCachedRollingInsightAssignmentStore(inner: RollingInsightAssignmentStore, ttl: number, clockValue: clock.Clock): RollingInsightAssignmentStore {
  return new CachedRollingInsightAssignmentStore(
    inner,
    cache.newTtlCache<RollingInsightAssignment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling insight assignments. Empty fields match all. */
export class RollingInsightAssignmentQuery {
  locale: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minStartsAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingInsightAssignment): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingInsightAssignment[]): RollingInsightAssignment[] {
    const matched = collections.filter(items, (candidate: RollingInsightAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingInsightAssignments(store: RollingInsightAssignmentStore, query: RollingInsightAssignmentQuery): RollingInsightAssignment[] {
  return query.apply(store.list());
}
