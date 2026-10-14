import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalReservation } from "./approval-reservation.js";

/** Keeps approval reservations by code. */
export interface ApprovalReservationStore {
  find(code: string): ApprovalReservation | undefined;
  save(item: ApprovalReservation): void;
  remove(code: string): boolean;
  list(): ApprovalReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalReservationStore implements ApprovalReservationStore {
  items: Map<string, ApprovalReservation>;
  order: string[];

  constructor(items: Map<string, ApprovalReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalReservation): void {
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

  list(): ApprovalReservation[] {
    const out: ApprovalReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalReservationStore(): ApprovalReservationStore {
  return new MemoryApprovalReservationStore(new Map<string, ApprovalReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalReservationStore implements ApprovalReservationStore {
  inner: ApprovalReservationStore;
  cache: cache.TtlCache<ApprovalReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalReservationStore,
    cacheValue: cache.TtlCache<ApprovalReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalReservation | undefined {
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

  save(item: ApprovalReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalReservation[] {
    return this.inner.list();
  }
}

export function newCachedApprovalReservationStore(inner: ApprovalReservationStore, ttl: number, clockValue: clock.Clock): ApprovalReservationStore {
  return new CachedApprovalReservationStore(inner, cache.newTtlCache<ApprovalReservation>(1024, ttl, clockValue), 0, 0);
}

/** Selects approval reservations. Empty fields match all. */
export class ApprovalReservationQuery {
  utmSource: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minVersion: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalReservation): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalReservation[]): ApprovalReservation[] {
    const matched = collections.filter(items, (candidate: ApprovalReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalReservations(store: ApprovalReservationStore, query: ApprovalReservationQuery): ApprovalReservation[] {
  return query.apply(store.list());
}
