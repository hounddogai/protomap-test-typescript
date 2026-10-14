import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortManifest } from "./cohort-manifest.js";

/** Keeps cohort manifests by code. */
export interface CohortManifestStore {
  find(code: string): CohortManifest | undefined;
  save(item: CohortManifest): void;
  remove(code: string): boolean;
  list(): CohortManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortManifestStore implements CohortManifestStore {
  items: Map<string, CohortManifest>;
  order: string[];

  constructor(items: Map<string, CohortManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortManifest): void {
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

  list(): CohortManifest[] {
    const out: CohortManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortManifestStore(): CohortManifestStore {
  return new MemoryCohortManifestStore(new Map<string, CohortManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortManifestStore implements CohortManifestStore {
  inner: CohortManifestStore;
  cache: cache.TtlCache<CohortManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: CohortManifestStore,
    cacheValue: cache.TtlCache<CohortManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortManifest | undefined {
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

  save(item: CohortManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortManifest[] {
    return this.inner.list();
  }
}

export function newCachedCohortManifestStore(inner: CohortManifestStore, ttl: number, clockValue: clock.Clock): CohortManifestStore {
  return new CachedCohortManifestStore(inner, cache.newTtlCache<CohortManifest>(1024, ttl, clockValue), 0, 0);
}

/** Selects cohort manifests. Empty fields match all. */
export class CohortManifestQuery {
  region: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCost: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortManifest): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortManifest[]): CohortManifest[] {
    const matched = collections.filter(items, (candidate: CohortManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortManifests(store: CohortManifestStore, query: CohortManifestQuery): CohortManifest[] {
  return query.apply(store.list());
}
