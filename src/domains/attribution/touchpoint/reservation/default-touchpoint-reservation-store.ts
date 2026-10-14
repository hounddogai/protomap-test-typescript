import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultTouchpointReservation } from "./default-touchpoint-reservation.js";

/** Keeps default touchpoint reservations by code. */
export interface DefaultTouchpointReservationStore {
  find(code: string): DefaultTouchpointReservation | undefined;
  save(item: DefaultTouchpointReservation): void;
  remove(code: string): boolean;
  list(): DefaultTouchpointReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultTouchpointReservationStore implements DefaultTouchpointReservationStore {
  items: Map<string, DefaultTouchpointReservation>;
  order: string[];

  constructor(items: Map<string, DefaultTouchpointReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultTouchpointReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultTouchpointReservation): void {
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

  list(): DefaultTouchpointReservation[] {
    const out: DefaultTouchpointReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultTouchpointReservationStore(): DefaultTouchpointReservationStore {
  return new MemoryDefaultTouchpointReservationStore(new Map<string, DefaultTouchpointReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultTouchpointReservationStore implements DefaultTouchpointReservationStore {
  inner: DefaultTouchpointReservationStore;
  cache: cache.TtlCache<DefaultTouchpointReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultTouchpointReservationStore,
    cacheValue: cache.TtlCache<DefaultTouchpointReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultTouchpointReservation | undefined {
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

  save(item: DefaultTouchpointReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultTouchpointReservation[] {
    return this.inner.list();
  }
}

export function newCachedDefaultTouchpointReservationStore(inner: DefaultTouchpointReservationStore, ttl: number, clockValue: clock.Clock): DefaultTouchpointReservationStore {
  return new CachedDefaultTouchpointReservationStore(
    inner,
    cache.newTtlCache<DefaultTouchpointReservation>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default touchpoint reservations. Empty fields match all. */
export class DefaultTouchpointReservationQuery {
  label: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minClicks: number, statuses: string[], limit: number) {
    this.label = label;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultTouchpointReservation): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultTouchpointReservation[]): DefaultTouchpointReservation[] {
    const matched = collections.filter(items, (candidate: DefaultTouchpointReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultTouchpointReservations(store: DefaultTouchpointReservationStore, query: DefaultTouchpointReservationQuery): DefaultTouchpointReservation[] {
  return query.apply(store.list());
}
