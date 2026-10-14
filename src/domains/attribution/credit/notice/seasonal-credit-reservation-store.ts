import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalCreditReservation } from "./seasonal-credit-reservation.js";

/** Keeps seasonal credit reservations by code. */
export interface SeasonalCreditReservationStore {
  find(code: string): SeasonalCreditReservation | undefined;
  save(item: SeasonalCreditReservation): void;
  remove(code: string): boolean;
  list(): SeasonalCreditReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalCreditReservationStore implements SeasonalCreditReservationStore {
  items: Map<string, SeasonalCreditReservation>;
  order: string[];

  constructor(items: Map<string, SeasonalCreditReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalCreditReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalCreditReservation): void {
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

  list(): SeasonalCreditReservation[] {
    const out: SeasonalCreditReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalCreditReservationStore(): SeasonalCreditReservationStore {
  return new MemorySeasonalCreditReservationStore(new Map<string, SeasonalCreditReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalCreditReservationStore implements SeasonalCreditReservationStore {
  inner: SeasonalCreditReservationStore;
  cache: cache.TtlCache<SeasonalCreditReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalCreditReservationStore,
    cacheValue: cache.TtlCache<SeasonalCreditReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalCreditReservation | undefined {
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

  save(item: SeasonalCreditReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalCreditReservation[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalCreditReservationStore(inner: SeasonalCreditReservationStore, ttl: number, clockValue: clock.Clock): SeasonalCreditReservationStore {
  return new CachedSeasonalCreditReservationStore(
    inner,
    cache.newTtlCache<SeasonalCreditReservation>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal credit reservations. Empty fields match all. */
export class SeasonalCreditReservationQuery {
  channel: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMargin: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalCreditReservation): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalCreditReservation[]): SeasonalCreditReservation[] {
    const matched = collections.filter(items, (candidate: SeasonalCreditReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalCreditReservations(store: SeasonalCreditReservationStore, query: SeasonalCreditReservationQuery): SeasonalCreditReservation[] {
  return query.apply(store.list());
}
