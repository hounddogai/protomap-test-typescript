import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualTouchpointAssignment } from "./manual-touchpoint-assignment.js";

/** Keeps manual touchpoint assignments by code. */
export interface ManualTouchpointAssignmentStore {
  find(code: string): ManualTouchpointAssignment | undefined;
  save(item: ManualTouchpointAssignment): void;
  remove(code: string): boolean;
  list(): ManualTouchpointAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualTouchpointAssignmentStore implements ManualTouchpointAssignmentStore {
  items: Map<string, ManualTouchpointAssignment>;
  order: string[];

  constructor(items: Map<string, ManualTouchpointAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualTouchpointAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualTouchpointAssignment): void {
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

  list(): ManualTouchpointAssignment[] {
    const out: ManualTouchpointAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualTouchpointAssignmentStore(): ManualTouchpointAssignmentStore {
  return new MemoryManualTouchpointAssignmentStore(new Map<string, ManualTouchpointAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualTouchpointAssignmentStore implements ManualTouchpointAssignmentStore {
  inner: ManualTouchpointAssignmentStore;
  cache: cache.TtlCache<ManualTouchpointAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualTouchpointAssignmentStore,
    cacheValue: cache.TtlCache<ManualTouchpointAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualTouchpointAssignment | undefined {
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

  save(item: ManualTouchpointAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualTouchpointAssignment[] {
    return this.inner.list();
  }
}

export function newCachedManualTouchpointAssignmentStore(inner: ManualTouchpointAssignmentStore, ttl: number, clockValue: clock.Clock): ManualTouchpointAssignmentStore {
  return new CachedManualTouchpointAssignmentStore(
    inner,
    cache.newTtlCache<ManualTouchpointAssignment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual touchpoint assignments. Empty fields match all. */
export class ManualTouchpointAssignmentQuery {
  locale: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRetries: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualTouchpointAssignment): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualTouchpointAssignment[]): ManualTouchpointAssignment[] {
    const matched = collections.filter(items, (candidate: ManualTouchpointAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualTouchpointAssignments(store: ManualTouchpointAssignmentStore, query: ManualTouchpointAssignmentQuery): ManualTouchpointAssignment[] {
  return query.apply(store.list());
}
