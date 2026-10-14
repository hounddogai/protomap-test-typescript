import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledPreferenceAssignment } from "./scheduled-preference-assignment.js";

/** Keeps scheduled preference assignments by code. */
export interface ScheduledPreferenceAssignmentStore {
  find(code: string): ScheduledPreferenceAssignment | undefined;
  save(item: ScheduledPreferenceAssignment): void;
  remove(code: string): boolean;
  list(): ScheduledPreferenceAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledPreferenceAssignmentStore implements ScheduledPreferenceAssignmentStore {
  items: Map<string, ScheduledPreferenceAssignment>;
  order: string[];

  constructor(items: Map<string, ScheduledPreferenceAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledPreferenceAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledPreferenceAssignment): void {
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

  list(): ScheduledPreferenceAssignment[] {
    const out: ScheduledPreferenceAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledPreferenceAssignmentStore(): ScheduledPreferenceAssignmentStore {
  return new MemoryScheduledPreferenceAssignmentStore(new Map<string, ScheduledPreferenceAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledPreferenceAssignmentStore implements ScheduledPreferenceAssignmentStore {
  inner: ScheduledPreferenceAssignmentStore;
  cache: cache.TtlCache<ScheduledPreferenceAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledPreferenceAssignmentStore,
    cacheValue: cache.TtlCache<ScheduledPreferenceAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledPreferenceAssignment | undefined {
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

  save(item: ScheduledPreferenceAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledPreferenceAssignment[] {
    return this.inner.list();
  }
}

export function newCachedScheduledPreferenceAssignmentStore(inner: ScheduledPreferenceAssignmentStore, ttl: number, clockValue: clock.Clock): ScheduledPreferenceAssignmentStore {
  return new CachedScheduledPreferenceAssignmentStore(
    inner,
    cache.newTtlCache<ScheduledPreferenceAssignment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled preference assignments. Empty fields match all. */
export class ScheduledPreferenceAssignmentQuery {
  category: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledPreferenceAssignment): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledPreferenceAssignment[]): ScheduledPreferenceAssignment[] {
    const matched = collections.filter(items, (candidate: ScheduledPreferenceAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledPreferenceAssignments(store: ScheduledPreferenceAssignmentStore, query: ScheduledPreferenceAssignmentQuery): ScheduledPreferenceAssignment[] {
  return query.apply(store.list());
}
