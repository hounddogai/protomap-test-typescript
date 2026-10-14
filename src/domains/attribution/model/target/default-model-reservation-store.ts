import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultModelReservation } from "./default-model-reservation.js";

/** Keeps default model reservations by code. */
export interface DefaultModelReservationStore {
  find(code: string): DefaultModelReservation | undefined;
  save(item: DefaultModelReservation): void;
  remove(code: string): boolean;
  list(): DefaultModelReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultModelReservationStore implements DefaultModelReservationStore {
  items: Map<string, DefaultModelReservation>;
  order: string[];

  constructor(items: Map<string, DefaultModelReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultModelReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultModelReservation): void {
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

  list(): DefaultModelReservation[] {
    const out: DefaultModelReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultModelReservationStore(): DefaultModelReservationStore {
  return new MemoryDefaultModelReservationStore(new Map<string, DefaultModelReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultModelReservationStore implements DefaultModelReservationStore {
  inner: DefaultModelReservationStore;
  cache: cache.TtlCache<DefaultModelReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultModelReservationStore,
    cacheValue: cache.TtlCache<DefaultModelReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultModelReservation | undefined {
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

  save(item: DefaultModelReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultModelReservation[] {
    return this.inner.list();
  }
}

export function newCachedDefaultModelReservationStore(inner: DefaultModelReservationStore, ttl: number, clockValue: clock.Clock): DefaultModelReservationStore {
  return new CachedDefaultModelReservationStore(
    inner,
    cache.newTtlCache<DefaultModelReservation>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default model reservations. Empty fields match all. */
export class DefaultModelReservationQuery {
  title: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultModelReservation): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultModelReservation[]): DefaultModelReservation[] {
    const matched = collections.filter(items, (candidate: DefaultModelReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultModelReservations(store: DefaultModelReservationStore, query: DefaultModelReservationQuery): DefaultModelReservation[] {
  return query.apply(store.list());
}
