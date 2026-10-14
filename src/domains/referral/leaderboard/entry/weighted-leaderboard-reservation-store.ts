import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedLeaderboardReservation } from "./weighted-leaderboard-reservation.js";

/** Keeps weighted leaderboard reservations by code. */
export interface WeightedLeaderboardReservationStore {
  find(code: string): WeightedLeaderboardReservation | undefined;
  save(item: WeightedLeaderboardReservation): void;
  remove(code: string): boolean;
  list(): WeightedLeaderboardReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedLeaderboardReservationStore implements WeightedLeaderboardReservationStore {
  items: Map<string, WeightedLeaderboardReservation>;
  order: string[];

  constructor(items: Map<string, WeightedLeaderboardReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedLeaderboardReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedLeaderboardReservation): void {
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

  list(): WeightedLeaderboardReservation[] {
    const out: WeightedLeaderboardReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedLeaderboardReservationStore(): WeightedLeaderboardReservationStore {
  return new MemoryWeightedLeaderboardReservationStore(new Map<string, WeightedLeaderboardReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedLeaderboardReservationStore implements WeightedLeaderboardReservationStore {
  inner: WeightedLeaderboardReservationStore;
  cache: cache.TtlCache<WeightedLeaderboardReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedLeaderboardReservationStore,
    cacheValue: cache.TtlCache<WeightedLeaderboardReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedLeaderboardReservation | undefined {
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

  save(item: WeightedLeaderboardReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedLeaderboardReservation[] {
    return this.inner.list();
  }
}

export function newCachedWeightedLeaderboardReservationStore(inner: WeightedLeaderboardReservationStore, ttl: number, clockValue: clock.Clock): WeightedLeaderboardReservationStore {
  return new CachedWeightedLeaderboardReservationStore(
    inner,
    cache.newTtlCache<WeightedLeaderboardReservation>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted leaderboard reservations. Empty fields match all. */
export class WeightedLeaderboardReservationQuery {
  unit: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minOpenRate: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedLeaderboardReservation): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedLeaderboardReservation[]): WeightedLeaderboardReservation[] {
    const matched = collections.filter(items, (candidate: WeightedLeaderboardReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedLeaderboardReservations(store: WeightedLeaderboardReservationStore, query: WeightedLeaderboardReservationQuery): WeightedLeaderboardReservation[] {
  return query.apply(store.list());
}
