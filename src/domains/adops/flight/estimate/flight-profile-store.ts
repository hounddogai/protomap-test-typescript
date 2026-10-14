import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightProfile } from "./flight-profile.js";

/** Keeps flight profiles by code. */
export interface FlightProfileStore {
  find(code: string): FlightProfile | undefined;
  save(item: FlightProfile): void;
  remove(code: string): boolean;
  list(): FlightProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightProfileStore implements FlightProfileStore {
  items: Map<string, FlightProfile>;
  order: string[];

  constructor(items: Map<string, FlightProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightProfile): void {
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

  list(): FlightProfile[] {
    const out: FlightProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightProfileStore(): FlightProfileStore {
  return new MemoryFlightProfileStore(new Map<string, FlightProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightProfileStore implements FlightProfileStore {
  inner: FlightProfileStore;
  cache: cache.TtlCache<FlightProfile>;
  hits: number;
  misses: number;

  constructor(inner: FlightProfileStore, cacheValue: cache.TtlCache<FlightProfile>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightProfile | undefined {
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

  save(item: FlightProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightProfile[] {
    return this.inner.list();
  }
}

export function newCachedFlightProfileStore(inner: FlightProfileStore, ttl: number, clockValue: clock.Clock): FlightProfileStore {
  return new CachedFlightProfileStore(inner, cache.newTtlCache<FlightProfile>(256, ttl, clockValue), 0, 0);
}

/** Selects flight profiles. Empty fields match all. */
export class FlightProfileQuery {
  region: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minGraceDays: number, statuses: string[], limit: number) {
    this.region = region;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightProfile): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightProfile[]): FlightProfile[] {
    const matched = collections.filter(items, (candidate: FlightProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightProfiles(store: FlightProfileStore, query: FlightProfileQuery): FlightProfile[] {
  return query.apply(store.list());
}
