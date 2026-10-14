import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultPacingReservation } from "./default-pacing-reservation.js";

/** Keeps default pacing reservations by code. */
export interface DefaultPacingReservationStore {
  find(code: string): DefaultPacingReservation | undefined;
  save(item: DefaultPacingReservation): void;
  remove(code: string): boolean;
  list(): DefaultPacingReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultPacingReservationStore implements DefaultPacingReservationStore {
  items: Map<string, DefaultPacingReservation>;
  order: string[];

  constructor(items: Map<string, DefaultPacingReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultPacingReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultPacingReservation): void {
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

  list(): DefaultPacingReservation[] {
    const out: DefaultPacingReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultPacingReservationStore(): DefaultPacingReservationStore {
  return new MemoryDefaultPacingReservationStore(new Map<string, DefaultPacingReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultPacingReservationStore implements DefaultPacingReservationStore {
  inner: DefaultPacingReservationStore;
  cache: cache.TtlCache<DefaultPacingReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultPacingReservationStore,
    cacheValue: cache.TtlCache<DefaultPacingReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultPacingReservation | undefined {
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

  save(item: DefaultPacingReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultPacingReservation[] {
    return this.inner.list();
  }
}

export function newCachedDefaultPacingReservationStore(inner: DefaultPacingReservationStore, ttl: number, clockValue: clock.Clock): DefaultPacingReservationStore {
  return new CachedDefaultPacingReservationStore(
    inner,
    cache.newTtlCache<DefaultPacingReservation>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default pacing reservations. Empty fields match all. */
export class DefaultPacingReservationQuery {
  label: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minVersion: number, statuses: string[], limit: number) {
    this.label = label;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultPacingReservation): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultPacingReservation[]): DefaultPacingReservation[] {
    const matched = collections.filter(items, (candidate: DefaultPacingReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultPacingReservations(store: DefaultPacingReservationStore, query: DefaultPacingReservationQuery): DefaultPacingReservation[] {
  return query.apply(store.list());
}
