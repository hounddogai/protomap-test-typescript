import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledLevelReservation } from "./scheduled-level-reservation.js";

/** Keeps scheduled level reservations by code. */
export interface ScheduledLevelReservationStore {
  find(code: string): ScheduledLevelReservation | undefined;
  save(item: ScheduledLevelReservation): void;
  remove(code: string): boolean;
  list(): ScheduledLevelReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledLevelReservationStore implements ScheduledLevelReservationStore {
  items: Map<string, ScheduledLevelReservation>;
  order: string[];

  constructor(items: Map<string, ScheduledLevelReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledLevelReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledLevelReservation): void {
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

  list(): ScheduledLevelReservation[] {
    const out: ScheduledLevelReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledLevelReservationStore(): ScheduledLevelReservationStore {
  return new MemoryScheduledLevelReservationStore(new Map<string, ScheduledLevelReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledLevelReservationStore implements ScheduledLevelReservationStore {
  inner: ScheduledLevelReservationStore;
  cache: cache.TtlCache<ScheduledLevelReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledLevelReservationStore,
    cacheValue: cache.TtlCache<ScheduledLevelReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledLevelReservation | undefined {
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

  save(item: ScheduledLevelReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledLevelReservation[] {
    return this.inner.list();
  }
}

export function newCachedScheduledLevelReservationStore(inner: ScheduledLevelReservationStore, ttl: number, clockValue: clock.Clock): ScheduledLevelReservationStore {
  return new CachedScheduledLevelReservationStore(
    inner,
    cache.newTtlCache<ScheduledLevelReservation>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled level reservations. Empty fields match all. */
export class ScheduledLevelReservationQuery {
  segment: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minWindowDays: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledLevelReservation): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledLevelReservation[]): ScheduledLevelReservation[] {
    const matched = collections.filter(items, (candidate: ScheduledLevelReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledLevelReservations(store: ScheduledLevelReservationStore, query: ScheduledLevelReservationQuery): ScheduledLevelReservation[] {
  return query.apply(store.list());
}
