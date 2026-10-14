import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultPreferenceReservation } from "./default-preference-reservation.js";

/** Keeps default preference reservations by code. */
export interface DefaultPreferenceReservationStore {
  find(code: string): DefaultPreferenceReservation | undefined;
  save(item: DefaultPreferenceReservation): void;
  remove(code: string): boolean;
  list(): DefaultPreferenceReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultPreferenceReservationStore implements DefaultPreferenceReservationStore {
  items: Map<string, DefaultPreferenceReservation>;
  order: string[];

  constructor(items: Map<string, DefaultPreferenceReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultPreferenceReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultPreferenceReservation): void {
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

  list(): DefaultPreferenceReservation[] {
    const out: DefaultPreferenceReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultPreferenceReservationStore(): DefaultPreferenceReservationStore {
  return new MemoryDefaultPreferenceReservationStore(new Map<string, DefaultPreferenceReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultPreferenceReservationStore implements DefaultPreferenceReservationStore {
  inner: DefaultPreferenceReservationStore;
  cache: cache.TtlCache<DefaultPreferenceReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultPreferenceReservationStore,
    cacheValue: cache.TtlCache<DefaultPreferenceReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultPreferenceReservation | undefined {
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

  save(item: DefaultPreferenceReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultPreferenceReservation[] {
    return this.inner.list();
  }
}

export function newCachedDefaultPreferenceReservationStore(inner: DefaultPreferenceReservationStore, ttl: number, clockValue: clock.Clock): DefaultPreferenceReservationStore {
  return new CachedDefaultPreferenceReservationStore(
    inner,
    cache.newTtlCache<DefaultPreferenceReservation>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default preference reservations. Empty fields match all. */
export class DefaultPreferenceReservationQuery {
  locale: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minFloorValue: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultPreferenceReservation): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultPreferenceReservation[]): DefaultPreferenceReservation[] {
    const matched = collections.filter(items, (candidate: DefaultPreferenceReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultPreferenceReservations(store: DefaultPreferenceReservationStore, query: DefaultPreferenceReservationQuery): DefaultPreferenceReservation[] {
  return query.apply(store.list());
}
