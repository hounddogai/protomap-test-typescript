import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostReservation } from "./post-reservation.js";

/** Keeps post reservations by code. */
export interface PostReservationStore {
  find(code: string): PostReservation | undefined;
  save(item: PostReservation): void;
  remove(code: string): boolean;
  list(): PostReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostReservationStore implements PostReservationStore {
  items: Map<string, PostReservation>;
  order: string[];

  constructor(items: Map<string, PostReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostReservation): void {
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

  list(): PostReservation[] {
    const out: PostReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostReservationStore(): PostReservationStore {
  return new MemoryPostReservationStore(new Map<string, PostReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostReservationStore implements PostReservationStore {
  inner: PostReservationStore;
  cache: cache.TtlCache<PostReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: PostReservationStore,
    cacheValue: cache.TtlCache<PostReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostReservation | undefined {
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

  save(item: PostReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostReservation[] {
    return this.inner.list();
  }
}

export function newCachedPostReservationStore(inner: PostReservationStore, ttl: number, clockValue: clock.Clock): PostReservationStore {
  return new CachedPostReservationStore(inner, cache.newTtlCache<PostReservation>(256, ttl, clockValue), 0, 0);
}

/** Selects post reservations. Empty fields match all. */
export class PostReservationQuery {
  title: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minWindowDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostReservation): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostReservation[]): PostReservation[] {
    const matched = collections.filter(items, (candidate: PostReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostReservations(store: PostReservationStore, query: PostReservationQuery): PostReservation[] {
  return query.apply(store.list());
}
