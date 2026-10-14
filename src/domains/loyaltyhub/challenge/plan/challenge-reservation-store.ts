import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeReservation } from "./challenge-reservation.js";

/** Keeps challenge reservations by code. */
export interface ChallengeReservationStore {
  find(code: string): ChallengeReservation | undefined;
  save(item: ChallengeReservation): void;
  remove(code: string): boolean;
  list(): ChallengeReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeReservationStore implements ChallengeReservationStore {
  items: Map<string, ChallengeReservation>;
  order: string[];

  constructor(items: Map<string, ChallengeReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeReservation): void {
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

  list(): ChallengeReservation[] {
    const out: ChallengeReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeReservationStore(): ChallengeReservationStore {
  return new MemoryChallengeReservationStore(new Map<string, ChallengeReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeReservationStore implements ChallengeReservationStore {
  inner: ChallengeReservationStore;
  cache: cache.TtlCache<ChallengeReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeReservationStore,
    cacheValue: cache.TtlCache<ChallengeReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeReservation | undefined {
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

  save(item: ChallengeReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeReservation[] {
    return this.inner.list();
  }
}

export function newCachedChallengeReservationStore(inner: ChallengeReservationStore, ttl: number, clockValue: clock.Clock): ChallengeReservationStore {
  return new CachedChallengeReservationStore(
    inner,
    cache.newTtlCache<ChallengeReservation>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects challenge reservations. Empty fields match all. */
export class ChallengeReservationQuery {
  channel: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minAmount: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeReservation): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeReservation[]): ChallengeReservation[] {
    const matched = collections.filter(items, (candidate: ChallengeReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeReservations(store: ChallengeReservationStore, query: ChallengeReservationQuery): ChallengeReservation[] {
  return query.apply(store.list());
}
