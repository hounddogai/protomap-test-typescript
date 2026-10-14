import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedPostReservation } from "./capped-post-reservation.js";

/** Keeps capped post reservations by code. */
export interface CappedPostReservationStore {
  find(code: string): CappedPostReservation | undefined;
  save(item: CappedPostReservation): void;
  remove(code: string): boolean;
  list(): CappedPostReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedPostReservationStore implements CappedPostReservationStore {
  items: Map<string, CappedPostReservation>;
  order: string[];

  constructor(items: Map<string, CappedPostReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedPostReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedPostReservation): void {
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

  list(): CappedPostReservation[] {
    const out: CappedPostReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedPostReservationStore(): CappedPostReservationStore {
  return new MemoryCappedPostReservationStore(new Map<string, CappedPostReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedPostReservationStore implements CappedPostReservationStore {
  inner: CappedPostReservationStore;
  cache: cache.TtlCache<CappedPostReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedPostReservationStore,
    cacheValue: cache.TtlCache<CappedPostReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedPostReservation | undefined {
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

  save(item: CappedPostReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedPostReservation[] {
    return this.inner.list();
  }
}

export function newCachedCappedPostReservationStore(inner: CappedPostReservationStore, ttl: number, clockValue: clock.Clock): CappedPostReservationStore {
  return new CachedCappedPostReservationStore(
    inner,
    cache.newTtlCache<CappedPostReservation>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped post reservations. Empty fields match all. */
export class CappedPostReservationQuery {
  unit: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minImpressions: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedPostReservation): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedPostReservation[]): CappedPostReservation[] {
    const matched = collections.filter(items, (candidate: CappedPostReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedPostReservations(store: CappedPostReservationStore, query: CappedPostReservationQuery): CappedPostReservation[] {
  return query.apply(store.list());
}
