import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardReservation } from "./reward-reservation.js";

/** Keeps reward reservations by code. */
export interface RewardReservationStore {
  find(code: string): RewardReservation | undefined;
  save(item: RewardReservation): void;
  remove(code: string): boolean;
  list(): RewardReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardReservationStore implements RewardReservationStore {
  items: Map<string, RewardReservation>;
  order: string[];

  constructor(items: Map<string, RewardReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardReservation): void {
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

  list(): RewardReservation[] {
    const out: RewardReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardReservationStore(): RewardReservationStore {
  return new MemoryRewardReservationStore(new Map<string, RewardReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardReservationStore implements RewardReservationStore {
  inner: RewardReservationStore;
  cache: cache.TtlCache<RewardReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardReservationStore,
    cacheValue: cache.TtlCache<RewardReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardReservation | undefined {
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

  save(item: RewardReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardReservation[] {
    return this.inner.list();
  }
}

export function newCachedRewardReservationStore(inner: RewardReservationStore, ttl: number, clockValue: clock.Clock): RewardReservationStore {
  return new CachedRewardReservationStore(inner, cache.newTtlCache<RewardReservation>(256, ttl, clockValue), 0, 0);
}

/** Selects reward reservations. Empty fields match all. */
export class RewardReservationQuery {
  name: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRetries: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardReservation): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardReservation[]): RewardReservation[] {
    const matched = collections.filter(items, (candidate: RewardReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardReservations(store: RewardReservationStore, query: RewardReservationQuery): RewardReservation[] {
  return query.apply(store.list());
}
