import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyTicketViewAssignment } from "./legacy-ticket-view-assignment.js";

/** Keeps legacy ticket view assignments by code. */
export interface LegacyTicketViewAssignmentStore {
  find(code: string): LegacyTicketViewAssignment | undefined;
  save(item: LegacyTicketViewAssignment): void;
  remove(code: string): boolean;
  list(): LegacyTicketViewAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyTicketViewAssignmentStore implements LegacyTicketViewAssignmentStore {
  items: Map<string, LegacyTicketViewAssignment>;
  order: string[];

  constructor(items: Map<string, LegacyTicketViewAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyTicketViewAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyTicketViewAssignment): void {
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

  list(): LegacyTicketViewAssignment[] {
    const out: LegacyTicketViewAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyTicketViewAssignmentStore(): LegacyTicketViewAssignmentStore {
  return new MemoryLegacyTicketViewAssignmentStore(new Map<string, LegacyTicketViewAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyTicketViewAssignmentStore implements LegacyTicketViewAssignmentStore {
  inner: LegacyTicketViewAssignmentStore;
  cache: cache.TtlCache<LegacyTicketViewAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyTicketViewAssignmentStore,
    cacheValue: cache.TtlCache<LegacyTicketViewAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyTicketViewAssignment | undefined {
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

  save(item: LegacyTicketViewAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyTicketViewAssignment[] {
    return this.inner.list();
  }
}

export function newCachedLegacyTicketViewAssignmentStore(inner: LegacyTicketViewAssignmentStore, ttl: number, clockValue: clock.Clock): LegacyTicketViewAssignmentStore {
  return new CachedLegacyTicketViewAssignmentStore(
    inner,
    cache.newTtlCache<LegacyTicketViewAssignment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy ticket view assignments. Empty fields match all. */
export class LegacyTicketViewAssignmentQuery {
  category: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRevision: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyTicketViewAssignment): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyTicketViewAssignment[]): LegacyTicketViewAssignment[] {
    const matched = collections.filter(items, (candidate: LegacyTicketViewAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyTicketViewAssignments(store: LegacyTicketViewAssignmentStore, query: LegacyTicketViewAssignmentQuery): LegacyTicketViewAssignment[] {
  return query.apply(store.list());
}
