import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionReservation } from "./retention-reservation.js";

/** Keeps retention reservations by code. */
export interface RetentionReservationStore {
  find(code: string): RetentionReservation | undefined;
  save(item: RetentionReservation): void;
  remove(code: string): boolean;
  list(): RetentionReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionReservationStore implements RetentionReservationStore {
  items: Map<string, RetentionReservation>;
  order: string[];

  constructor(items: Map<string, RetentionReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionReservation): void {
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

  list(): RetentionReservation[] {
    const out: RetentionReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionReservationStore(): RetentionReservationStore {
  return new MemoryRetentionReservationStore(new Map<string, RetentionReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionReservationStore implements RetentionReservationStore {
  inner: RetentionReservationStore;
  cache: cache.TtlCache<RetentionReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionReservationStore,
    cacheValue: cache.TtlCache<RetentionReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionReservation | undefined {
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

  save(item: RetentionReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionReservation[] {
    return this.inner.list();
  }
}

export function newCachedRetentionReservationStore(inner: RetentionReservationStore, ttl: number, clockValue: clock.Clock): RetentionReservationStore {
  return new CachedRetentionReservationStore(
    inner,
    cache.newTtlCache<RetentionReservation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects retention reservations. Empty fields match all. */
export class RetentionReservationQuery {
  name: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minScore: number, statuses: string[], limit: number) {
    this.name = name;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionReservation): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionReservation[]): RetentionReservation[] {
    const matched = collections.filter(items, (candidate: RetentionReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionReservations(store: RetentionReservationStore, query: RetentionReservationQuery): RetentionReservation[] {
  return query.apply(store.list());
}
