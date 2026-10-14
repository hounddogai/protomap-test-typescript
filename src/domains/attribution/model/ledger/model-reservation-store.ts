import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ModelReservation } from "./model-reservation.js";

/** Keeps model reservations by code. */
export interface ModelReservationStore {
  find(code: string): ModelReservation | undefined;
  save(item: ModelReservation): void;
  remove(code: string): boolean;
  list(): ModelReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryModelReservationStore implements ModelReservationStore {
  items: Map<string, ModelReservation>;
  order: string[];

  constructor(items: Map<string, ModelReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ModelReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ModelReservation): void {
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

  list(): ModelReservation[] {
    const out: ModelReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryModelReservationStore(): ModelReservationStore {
  return new MemoryModelReservationStore(new Map<string, ModelReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedModelReservationStore implements ModelReservationStore {
  inner: ModelReservationStore;
  cache: cache.TtlCache<ModelReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: ModelReservationStore,
    cacheValue: cache.TtlCache<ModelReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ModelReservation | undefined {
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

  save(item: ModelReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ModelReservation[] {
    return this.inner.list();
  }
}

export function newCachedModelReservationStore(inner: ModelReservationStore, ttl: number, clockValue: clock.Clock): ModelReservationStore {
  return new CachedModelReservationStore(inner, cache.newTtlCache<ModelReservation>(256, ttl, clockValue), 0, 0);
}

/** Selects model reservations. Empty fields match all. */
export class ModelReservationQuery {
  source: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minStartsAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ModelReservation): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ModelReservation[]): ModelReservation[] {
    const matched = collections.filter(items, (candidate: ModelReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findModelReservations(store: ModelReservationStore, query: ModelReservationQuery): ModelReservation[] {
  return query.apply(store.list());
}
