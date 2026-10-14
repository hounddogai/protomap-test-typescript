import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryInsightReservation } from "./primary-insight-reservation.js";

/** Keeps primary insight reservations by code. */
export interface PrimaryInsightReservationStore {
  find(code: string): PrimaryInsightReservation | undefined;
  save(item: PrimaryInsightReservation): void;
  remove(code: string): boolean;
  list(): PrimaryInsightReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryInsightReservationStore implements PrimaryInsightReservationStore {
  items: Map<string, PrimaryInsightReservation>;
  order: string[];

  constructor(items: Map<string, PrimaryInsightReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryInsightReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryInsightReservation): void {
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

  list(): PrimaryInsightReservation[] {
    const out: PrimaryInsightReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryInsightReservationStore(): PrimaryInsightReservationStore {
  return new MemoryPrimaryInsightReservationStore(new Map<string, PrimaryInsightReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryInsightReservationStore implements PrimaryInsightReservationStore {
  inner: PrimaryInsightReservationStore;
  cache: cache.TtlCache<PrimaryInsightReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryInsightReservationStore,
    cacheValue: cache.TtlCache<PrimaryInsightReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryInsightReservation | undefined {
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

  save(item: PrimaryInsightReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryInsightReservation[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryInsightReservationStore(inner: PrimaryInsightReservationStore, ttl: number, clockValue: clock.Clock): PrimaryInsightReservationStore {
  return new CachedPrimaryInsightReservationStore(
    inner,
    cache.newTtlCache<PrimaryInsightReservation>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary insight reservations. Empty fields match all. */
export class PrimaryInsightReservationQuery {
  name: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minImpressions: number, statuses: string[], limit: number) {
    this.name = name;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryInsightReservation): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryInsightReservation[]): PrimaryInsightReservation[] {
    const matched = collections.filter(items, (candidate: PrimaryInsightReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryInsightReservations(store: PrimaryInsightReservationStore, query: PrimaryInsightReservationQuery): PrimaryInsightReservation[] {
  return query.apply(store.list());
}
