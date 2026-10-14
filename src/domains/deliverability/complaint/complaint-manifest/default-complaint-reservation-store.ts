import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultComplaintReservation } from "./default-complaint-reservation.js";

/** Keeps default complaint reservations by code. */
export interface DefaultComplaintReservationStore {
  find(code: string): DefaultComplaintReservation | undefined;
  save(item: DefaultComplaintReservation): void;
  remove(code: string): boolean;
  list(): DefaultComplaintReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultComplaintReservationStore implements DefaultComplaintReservationStore {
  items: Map<string, DefaultComplaintReservation>;
  order: string[];

  constructor(items: Map<string, DefaultComplaintReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultComplaintReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultComplaintReservation): void {
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

  list(): DefaultComplaintReservation[] {
    const out: DefaultComplaintReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultComplaintReservationStore(): DefaultComplaintReservationStore {
  return new MemoryDefaultComplaintReservationStore(new Map<string, DefaultComplaintReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultComplaintReservationStore implements DefaultComplaintReservationStore {
  inner: DefaultComplaintReservationStore;
  cache: cache.TtlCache<DefaultComplaintReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultComplaintReservationStore,
    cacheValue: cache.TtlCache<DefaultComplaintReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultComplaintReservation | undefined {
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

  save(item: DefaultComplaintReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultComplaintReservation[] {
    return this.inner.list();
  }
}

export function newCachedDefaultComplaintReservationStore(inner: DefaultComplaintReservationStore, ttl: number, clockValue: clock.Clock): DefaultComplaintReservationStore {
  return new CachedDefaultComplaintReservationStore(
    inner,
    cache.newTtlCache<DefaultComplaintReservation>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default complaint reservations. Empty fields match all. */
export class DefaultComplaintReservationQuery {
  title: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBudget: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultComplaintReservation): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultComplaintReservation[]): DefaultComplaintReservation[] {
    const matched = collections.filter(items, (candidate: DefaultComplaintReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultComplaintReservations(store: DefaultComplaintReservationStore, query: DefaultComplaintReservationQuery): DefaultComplaintReservation[] {
  return query.apply(store.list());
}
