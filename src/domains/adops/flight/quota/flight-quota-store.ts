import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightQuota } from "./flight-quota.js";

/** Keeps flight quotas by code. */
export interface FlightQuotaStore {
  find(code: string): FlightQuota | undefined;
  save(item: FlightQuota): void;
  remove(code: string): boolean;
  list(): FlightQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightQuotaStore implements FlightQuotaStore {
  items: Map<string, FlightQuota>;
  order: string[];

  constructor(items: Map<string, FlightQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightQuota): void {
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

  list(): FlightQuota[] {
    const out: FlightQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightQuotaStore(): FlightQuotaStore {
  return new MemoryFlightQuotaStore(new Map<string, FlightQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightQuotaStore implements FlightQuotaStore {
  inner: FlightQuotaStore;
  cache: cache.TtlCache<FlightQuota>;
  hits: number;
  misses: number;

  constructor(inner: FlightQuotaStore, cacheValue: cache.TtlCache<FlightQuota>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightQuota | undefined {
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

  save(item: FlightQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightQuota[] {
    return this.inner.list();
  }
}

export function newCachedFlightQuotaStore(inner: FlightQuotaStore, ttl: number, clockValue: clock.Clock): FlightQuotaStore {
  return new CachedFlightQuotaStore(inner, cache.newTtlCache<FlightQuota>(1024, ttl, clockValue), 0, 0);
}

/** Selects flight quotas. Empty fields match all. */
export class FlightQuotaQuery {
  segment: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minSendAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightQuota): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightQuota[]): FlightQuota[] {
    const matched = collections.filter(items, (candidate: FlightQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightQuotas(store: FlightQuotaStore, query: FlightQuotaQuery): FlightQuota[] {
  return query.apply(store.list());
}
