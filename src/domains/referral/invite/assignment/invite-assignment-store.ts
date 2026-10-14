import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteAssignment } from "./invite-assignment.js";

/** Keeps invite assignments by code. */
export interface InviteAssignmentStore {
  find(code: string): InviteAssignment | undefined;
  save(item: InviteAssignment): void;
  remove(code: string): boolean;
  list(): InviteAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteAssignmentStore implements InviteAssignmentStore {
  items: Map<string, InviteAssignment>;
  order: string[];

  constructor(items: Map<string, InviteAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteAssignment): void {
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

  list(): InviteAssignment[] {
    const out: InviteAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteAssignmentStore(): InviteAssignmentStore {
  return new MemoryInviteAssignmentStore(new Map<string, InviteAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteAssignmentStore implements InviteAssignmentStore {
  inner: InviteAssignmentStore;
  cache: cache.TtlCache<InviteAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: InviteAssignmentStore,
    cacheValue: cache.TtlCache<InviteAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteAssignment | undefined {
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

  save(item: InviteAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteAssignment[] {
    return this.inner.list();
  }
}

export function newCachedInviteAssignmentStore(inner: InviteAssignmentStore, ttl: number, clockValue: clock.Clock): InviteAssignmentStore {
  return new CachedInviteAssignmentStore(inner, cache.newTtlCache<InviteAssignment>(1024, ttl, clockValue), 0, 0);
}

/** Selects invite assignments. Empty fields match all. */
export class InviteAssignmentQuery {
  country: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minClicks: number, statuses: string[], limit: number) {
    this.country = country;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteAssignment): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteAssignment[]): InviteAssignment[] {
    const matched = collections.filter(items, (candidate: InviteAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteAssignments(store: InviteAssignmentStore, query: InviteAssignmentQuery): InviteAssignment[] {
  return query.apply(store.list());
}
