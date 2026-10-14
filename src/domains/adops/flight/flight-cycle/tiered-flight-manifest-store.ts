import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredFlightManifest } from "./tiered-flight-manifest.js";

/** Keeps tiered flight manifests by code. */
export interface TieredFlightManifestStore {
  find(code: string): TieredFlightManifest | undefined;
  save(item: TieredFlightManifest): void;
  remove(code: string): boolean;
  list(): TieredFlightManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredFlightManifestStore implements TieredFlightManifestStore {
  items: Map<string, TieredFlightManifest>;
  order: string[];

  constructor(items: Map<string, TieredFlightManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredFlightManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredFlightManifest): void {
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

  list(): TieredFlightManifest[] {
    const out: TieredFlightManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredFlightManifestStore(): TieredFlightManifestStore {
  return new MemoryTieredFlightManifestStore(new Map<string, TieredFlightManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredFlightManifestStore implements TieredFlightManifestStore {
  inner: TieredFlightManifestStore;
  cache: cache.TtlCache<TieredFlightManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredFlightManifestStore,
    cacheValue: cache.TtlCache<TieredFlightManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredFlightManifest | undefined {
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

  save(item: TieredFlightManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredFlightManifest[] {
    return this.inner.list();
  }
}

export function newCachedTieredFlightManifestStore(inner: TieredFlightManifestStore, ttl: number, clockValue: clock.Clock): TieredFlightManifestStore {
  return new CachedTieredFlightManifestStore(
    inner,
    cache.newTtlCache<TieredFlightManifest>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered flight manifests. Empty fields match all. */
export class TieredFlightManifestQuery {
  country: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minCeiling: number, statuses: string[], limit: number) {
    this.country = country;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredFlightManifest): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredFlightManifest[]): TieredFlightManifest[] {
    const matched = collections.filter(items, (candidate: TieredFlightManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredFlightManifests(store: TieredFlightManifestStore, query: TieredFlightManifestQuery): TieredFlightManifest[] {
  return query.apply(store.list());
}
