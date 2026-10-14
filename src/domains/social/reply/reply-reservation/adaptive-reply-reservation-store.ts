import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveReplyReservation } from "./adaptive-reply-reservation.js";

/** Keeps adaptive reply reservations by code. */
export interface AdaptiveReplyReservationStore {
  find(code: string): AdaptiveReplyReservation | undefined;
  save(item: AdaptiveReplyReservation): void;
  remove(code: string): boolean;
  list(): AdaptiveReplyReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveReplyReservationStore implements AdaptiveReplyReservationStore {
  items: Map<string, AdaptiveReplyReservation>;
  order: string[];

  constructor(items: Map<string, AdaptiveReplyReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveReplyReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveReplyReservation): void {
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

  list(): AdaptiveReplyReservation[] {
    const out: AdaptiveReplyReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveReplyReservationStore(): AdaptiveReplyReservationStore {
  return new MemoryAdaptiveReplyReservationStore(new Map<string, AdaptiveReplyReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveReplyReservationStore implements AdaptiveReplyReservationStore {
  inner: AdaptiveReplyReservationStore;
  cache: cache.TtlCache<AdaptiveReplyReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveReplyReservationStore,
    cacheValue: cache.TtlCache<AdaptiveReplyReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveReplyReservation | undefined {
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

  save(item: AdaptiveReplyReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveReplyReservation[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveReplyReservationStore(inner: AdaptiveReplyReservationStore, ttl: number, clockValue: clock.Clock): AdaptiveReplyReservationStore {
  return new CachedAdaptiveReplyReservationStore(
    inner,
    cache.newTtlCache<AdaptiveReplyReservation>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive reply reservations. Empty fields match all. */
export class AdaptiveReplyReservationQuery {
  title: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minPriority: number, statuses: string[], limit: number) {
    this.title = title;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveReplyReservation): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveReplyReservation[]): AdaptiveReplyReservation[] {
    const matched = collections.filter(items, (candidate: AdaptiveReplyReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveReplyReservations(store: AdaptiveReplyReservationStore, query: AdaptiveReplyReservationQuery): AdaptiveReplyReservation[] {
  return query.apply(store.list());
}
