import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalTicketViewAssignment } from "./seasonal-ticket-view-assignment.js";

/** Keeps seasonal ticket view assignments by code. */
export interface SeasonalTicketViewAssignmentStore {
  find(code: string): SeasonalTicketViewAssignment | undefined;
  save(item: SeasonalTicketViewAssignment): void;
  remove(code: string): boolean;
  list(): SeasonalTicketViewAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalTicketViewAssignmentStore implements SeasonalTicketViewAssignmentStore {
  items: Map<string, SeasonalTicketViewAssignment>;
  order: string[];

  constructor(items: Map<string, SeasonalTicketViewAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalTicketViewAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalTicketViewAssignment): void {
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

  list(): SeasonalTicketViewAssignment[] {
    const out: SeasonalTicketViewAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalTicketViewAssignmentStore(): SeasonalTicketViewAssignmentStore {
  return new MemorySeasonalTicketViewAssignmentStore(new Map<string, SeasonalTicketViewAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalTicketViewAssignmentStore implements SeasonalTicketViewAssignmentStore {
  inner: SeasonalTicketViewAssignmentStore;
  cache: cache.TtlCache<SeasonalTicketViewAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalTicketViewAssignmentStore,
    cacheValue: cache.TtlCache<SeasonalTicketViewAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalTicketViewAssignment | undefined {
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

  save(item: SeasonalTicketViewAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalTicketViewAssignment[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalTicketViewAssignmentStore(inner: SeasonalTicketViewAssignmentStore, ttl: number, clockValue: clock.Clock): SeasonalTicketViewAssignmentStore {
  return new CachedSeasonalTicketViewAssignmentStore(
    inner,
    cache.newTtlCache<SeasonalTicketViewAssignment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal ticket view assignments. Empty fields match all. */
export class SeasonalTicketViewAssignmentQuery {
  locale: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBid: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalTicketViewAssignment): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalTicketViewAssignment[]): SeasonalTicketViewAssignment[] {
    const matched = collections.filter(items, (candidate: SeasonalTicketViewAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalTicketViewAssignments(store: SeasonalTicketViewAssignmentStore, query: SeasonalTicketViewAssignmentQuery): SeasonalTicketViewAssignment[] {
  return query.apply(store.list());
}
