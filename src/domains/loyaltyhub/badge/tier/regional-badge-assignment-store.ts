import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalBadgeAssignment } from "./regional-badge-assignment.js";

/** Keeps regional badge assignments by code. */
export interface RegionalBadgeAssignmentStore {
  find(code: string): RegionalBadgeAssignment | undefined;
  save(item: RegionalBadgeAssignment): void;
  remove(code: string): boolean;
  list(): RegionalBadgeAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalBadgeAssignmentStore implements RegionalBadgeAssignmentStore {
  items: Map<string, RegionalBadgeAssignment>;
  order: string[];

  constructor(items: Map<string, RegionalBadgeAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalBadgeAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalBadgeAssignment): void {
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

  list(): RegionalBadgeAssignment[] {
    const out: RegionalBadgeAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalBadgeAssignmentStore(): RegionalBadgeAssignmentStore {
  return new MemoryRegionalBadgeAssignmentStore(new Map<string, RegionalBadgeAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalBadgeAssignmentStore implements RegionalBadgeAssignmentStore {
  inner: RegionalBadgeAssignmentStore;
  cache: cache.TtlCache<RegionalBadgeAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalBadgeAssignmentStore,
    cacheValue: cache.TtlCache<RegionalBadgeAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalBadgeAssignment | undefined {
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

  save(item: RegionalBadgeAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalBadgeAssignment[] {
    return this.inner.list();
  }
}

export function newCachedRegionalBadgeAssignmentStore(inner: RegionalBadgeAssignmentStore, ttl: number, clockValue: clock.Clock): RegionalBadgeAssignmentStore {
  return new CachedRegionalBadgeAssignmentStore(
    inner,
    cache.newTtlCache<RegionalBadgeAssignment>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional badge assignments. Empty fields match all. */
export class RegionalBadgeAssignmentQuery {
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

  matches(item: RegionalBadgeAssignment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalBadgeAssignment[]): RegionalBadgeAssignment[] {
    const matched = collections.filter(items, (candidate: RegionalBadgeAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalBadgeAssignments(store: RegionalBadgeAssignmentStore, query: RegionalBadgeAssignmentQuery): RegionalBadgeAssignment[] {
  return query.apply(store.list());
}
