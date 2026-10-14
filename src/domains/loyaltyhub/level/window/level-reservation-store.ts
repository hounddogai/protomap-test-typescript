import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LevelReservation } from "./level-reservation.js";

/** Keeps level reservations by code. */
export interface LevelReservationStore {
  find(code: string): LevelReservation | undefined;
  save(item: LevelReservation): void;
  remove(code: string): boolean;
  list(): LevelReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLevelReservationStore implements LevelReservationStore {
  items: Map<string, LevelReservation>;
  order: string[];

  constructor(items: Map<string, LevelReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LevelReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LevelReservation): void {
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

  list(): LevelReservation[] {
    const out: LevelReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLevelReservationStore(): LevelReservationStore {
  return new MemoryLevelReservationStore(new Map<string, LevelReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLevelReservationStore implements LevelReservationStore {
  inner: LevelReservationStore;
  cache: cache.TtlCache<LevelReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: LevelReservationStore,
    cacheValue: cache.TtlCache<LevelReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LevelReservation | undefined {
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

  save(item: LevelReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LevelReservation[] {
    return this.inner.list();
  }
}

export function newCachedLevelReservationStore(inner: LevelReservationStore, ttl: number, clockValue: clock.Clock): LevelReservationStore {
  return new CachedLevelReservationStore(inner, cache.newTtlCache<LevelReservation>(1024, ttl, clockValue), 0, 0);
}

/** Selects level reservations. Empty fields match all. */
export class LevelReservationQuery {
  category: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minPriority: number, statuses: string[], limit: number) {
    this.category = category;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LevelReservation): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LevelReservation[]): LevelReservation[] {
    const matched = collections.filter(items, (candidate: LevelReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLevelReservations(store: LevelReservationStore, query: LevelReservationQuery): LevelReservation[] {
  return query.apply(store.list());
}
