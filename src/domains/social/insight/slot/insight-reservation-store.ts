import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightReservation } from "./insight-reservation.js";

/** Keeps insight reservations by code. */
export interface InsightReservationStore {
  find(code: string): InsightReservation | undefined;
  save(item: InsightReservation): void;
  remove(code: string): boolean;
  list(): InsightReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightReservationStore implements InsightReservationStore {
  items: Map<string, InsightReservation>;
  order: string[];

  constructor(items: Map<string, InsightReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightReservation): void {
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

  list(): InsightReservation[] {
    const out: InsightReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightReservationStore(): InsightReservationStore {
  return new MemoryInsightReservationStore(new Map<string, InsightReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightReservationStore implements InsightReservationStore {
  inner: InsightReservationStore;
  cache: cache.TtlCache<InsightReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: InsightReservationStore,
    cacheValue: cache.TtlCache<InsightReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightReservation | undefined {
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

  save(item: InsightReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightReservation[] {
    return this.inner.list();
  }
}

export function newCachedInsightReservationStore(inner: InsightReservationStore, ttl: number, clockValue: clock.Clock): InsightReservationStore {
  return new CachedInsightReservationStore(inner, cache.newTtlCache<InsightReservation>(512, ttl, clockValue), 0, 0);
}

/** Selects insight reservations. Empty fields match all. */
export class InsightReservationQuery {
  source: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minBudget: number, statuses: string[], limit: number) {
    this.source = source;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightReservation): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightReservation[]): InsightReservation[] {
    const matched = collections.filter(items, (candidate: InsightReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightReservations(store: InsightReservationStore, query: InsightReservationQuery): InsightReservation[] {
  return query.apply(store.list());
}
