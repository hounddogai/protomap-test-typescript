import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightManifest } from "./flight-manifest.js";

/** Keeps flight manifests by code. */
export interface FlightManifestStore {
  find(code: string): FlightManifest | undefined;
  save(item: FlightManifest): void;
  remove(code: string): boolean;
  list(): FlightManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightManifestStore implements FlightManifestStore {
  items: Map<string, FlightManifest>;
  order: string[];

  constructor(items: Map<string, FlightManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightManifest): void {
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

  list(): FlightManifest[] {
    const out: FlightManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightManifestStore(): FlightManifestStore {
  return new MemoryFlightManifestStore(new Map<string, FlightManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightManifestStore implements FlightManifestStore {
  inner: FlightManifestStore;
  cache: cache.TtlCache<FlightManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: FlightManifestStore,
    cacheValue: cache.TtlCache<FlightManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightManifest | undefined {
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

  save(item: FlightManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightManifest[] {
    return this.inner.list();
  }
}

export function newCachedFlightManifestStore(inner: FlightManifestStore, ttl: number, clockValue: clock.Clock): FlightManifestStore {
  return new CachedFlightManifestStore(inner, cache.newTtlCache<FlightManifest>(512, ttl, clockValue), 0, 0);
}

/** Selects flight manifests. Empty fields match all. */
export class FlightManifestQuery {
  unit: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minGraceDays: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightManifest): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightManifest[]): FlightManifest[] {
    const matched = collections.filter(items, (candidate: FlightManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightManifests(store: FlightManifestStore, query: FlightManifestQuery): FlightManifest[] {
  return query.apply(store.list());
}
