import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewAssignment } from "./ticket-view-assignment.js";

/** Keeps ticket view assignments by code. */
export interface TicketViewAssignmentStore {
  find(code: string): TicketViewAssignment | undefined;
  save(item: TicketViewAssignment): void;
  remove(code: string): boolean;
  list(): TicketViewAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewAssignmentStore implements TicketViewAssignmentStore {
  items: Map<string, TicketViewAssignment>;
  order: string[];

  constructor(items: Map<string, TicketViewAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewAssignment): void {
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

  list(): TicketViewAssignment[] {
    const out: TicketViewAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewAssignmentStore(): TicketViewAssignmentStore {
  return new MemoryTicketViewAssignmentStore(new Map<string, TicketViewAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewAssignmentStore implements TicketViewAssignmentStore {
  inner: TicketViewAssignmentStore;
  cache: cache.TtlCache<TicketViewAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewAssignmentStore,
    cacheValue: cache.TtlCache<TicketViewAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewAssignment | undefined {
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

  save(item: TicketViewAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewAssignment[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewAssignmentStore(inner: TicketViewAssignmentStore, ttl: number, clockValue: clock.Clock): TicketViewAssignmentStore {
  return new CachedTicketViewAssignmentStore(inner, cache.newTtlCache<TicketViewAssignment>(64, ttl, clockValue), 0, 0);
}

/** Selects ticket view assignments. Empty fields match all. */
export class TicketViewAssignmentQuery {
  segment: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minStartsAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewAssignment): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewAssignment[]): TicketViewAssignment[] {
    const matched = collections.filter(items, (candidate: TicketViewAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewAssignments(store: TicketViewAssignmentStore, query: TicketViewAssignmentQuery): TicketViewAssignment[] {
  return query.apply(store.list());
}
