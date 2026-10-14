import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveTicketViewAssignment } from "./adaptive-ticket-view-assignment.js";

/** Keeps adaptive ticket view assignments by code. */
export interface AdaptiveTicketViewAssignmentStore {
  find(code: string): AdaptiveTicketViewAssignment | undefined;
  save(item: AdaptiveTicketViewAssignment): void;
  remove(code: string): boolean;
  list(): AdaptiveTicketViewAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveTicketViewAssignmentStore implements AdaptiveTicketViewAssignmentStore {
  items: Map<string, AdaptiveTicketViewAssignment>;
  order: string[];

  constructor(items: Map<string, AdaptiveTicketViewAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveTicketViewAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveTicketViewAssignment): void {
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

  list(): AdaptiveTicketViewAssignment[] {
    const out: AdaptiveTicketViewAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveTicketViewAssignmentStore(): AdaptiveTicketViewAssignmentStore {
  return new MemoryAdaptiveTicketViewAssignmentStore(new Map<string, AdaptiveTicketViewAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveTicketViewAssignmentStore implements AdaptiveTicketViewAssignmentStore {
  inner: AdaptiveTicketViewAssignmentStore;
  cache: cache.TtlCache<AdaptiveTicketViewAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveTicketViewAssignmentStore,
    cacheValue: cache.TtlCache<AdaptiveTicketViewAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveTicketViewAssignment | undefined {
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

  save(item: AdaptiveTicketViewAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveTicketViewAssignment[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveTicketViewAssignmentStore(inner: AdaptiveTicketViewAssignmentStore, ttl: number, clockValue: clock.Clock): AdaptiveTicketViewAssignmentStore {
  return new CachedAdaptiveTicketViewAssignmentStore(
    inner,
    cache.newTtlCache<AdaptiveTicketViewAssignment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive ticket view assignments. Empty fields match all. */
export class AdaptiveTicketViewAssignmentQuery {
  name: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAmount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveTicketViewAssignment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveTicketViewAssignment[]): AdaptiveTicketViewAssignment[] {
    const matched = collections.filter(items, (candidate: AdaptiveTicketViewAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveTicketViewAssignments(store: AdaptiveTicketViewAssignmentStore, query: AdaptiveTicketViewAssignmentQuery): AdaptiveTicketViewAssignment[] {
  return query.apply(store.list());
}
