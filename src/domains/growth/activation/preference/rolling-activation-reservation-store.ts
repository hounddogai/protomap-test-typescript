import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingActivationReservation } from "./rolling-activation-reservation.js";

/** Keeps rolling activation reservations by code. */
export interface RollingActivationReservationStore {
  find(code: string): RollingActivationReservation | undefined;
  save(item: RollingActivationReservation): void;
  remove(code: string): boolean;
  list(): RollingActivationReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingActivationReservationStore implements RollingActivationReservationStore {
  items: Map<string, RollingActivationReservation>;
  order: string[];

  constructor(items: Map<string, RollingActivationReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingActivationReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingActivationReservation): void {
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

  list(): RollingActivationReservation[] {
    const out: RollingActivationReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingActivationReservationStore(): RollingActivationReservationStore {
  return new MemoryRollingActivationReservationStore(new Map<string, RollingActivationReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingActivationReservationStore implements RollingActivationReservationStore {
  inner: RollingActivationReservationStore;
  cache: cache.TtlCache<RollingActivationReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingActivationReservationStore,
    cacheValue: cache.TtlCache<RollingActivationReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingActivationReservation | undefined {
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

  save(item: RollingActivationReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingActivationReservation[] {
    return this.inner.list();
  }
}

export function newCachedRollingActivationReservationStore(inner: RollingActivationReservationStore, ttl: number, clockValue: clock.Clock): RollingActivationReservationStore {
  return new CachedRollingActivationReservationStore(
    inner,
    cache.newTtlCache<RollingActivationReservation>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling activation reservations. Empty fields match all. */
export class RollingActivationReservationQuery {
  label: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingActivationReservation): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingActivationReservation[]): RollingActivationReservation[] {
    const matched = collections.filter(items, (candidate: RollingActivationReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingActivationReservations(store: RollingActivationReservationStore, query: RollingActivationReservationQuery): RollingActivationReservation[] {
  return query.apply(store.list());
}
