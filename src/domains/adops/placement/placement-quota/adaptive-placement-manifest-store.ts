import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptivePlacementManifest } from "./adaptive-placement-manifest.js";

/** Keeps adaptive placement manifests by code. */
export interface AdaptivePlacementManifestStore {
  find(code: string): AdaptivePlacementManifest | undefined;
  save(item: AdaptivePlacementManifest): void;
  remove(code: string): boolean;
  list(): AdaptivePlacementManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptivePlacementManifestStore implements AdaptivePlacementManifestStore {
  items: Map<string, AdaptivePlacementManifest>;
  order: string[];

  constructor(items: Map<string, AdaptivePlacementManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptivePlacementManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptivePlacementManifest): void {
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

  list(): AdaptivePlacementManifest[] {
    const out: AdaptivePlacementManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptivePlacementManifestStore(): AdaptivePlacementManifestStore {
  return new MemoryAdaptivePlacementManifestStore(new Map<string, AdaptivePlacementManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptivePlacementManifestStore implements AdaptivePlacementManifestStore {
  inner: AdaptivePlacementManifestStore;
  cache: cache.TtlCache<AdaptivePlacementManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptivePlacementManifestStore,
    cacheValue: cache.TtlCache<AdaptivePlacementManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptivePlacementManifest | undefined {
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

  save(item: AdaptivePlacementManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptivePlacementManifest[] {
    return this.inner.list();
  }
}

export function newCachedAdaptivePlacementManifestStore(inner: AdaptivePlacementManifestStore, ttl: number, clockValue: clock.Clock): AdaptivePlacementManifestStore {
  return new CachedAdaptivePlacementManifestStore(
    inner,
    cache.newTtlCache<AdaptivePlacementManifest>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive placement manifests. Empty fields match all. */
export class AdaptivePlacementManifestQuery {
  label: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptivePlacementManifest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptivePlacementManifest[]): AdaptivePlacementManifest[] {
    const matched = collections.filter(items, (candidate: AdaptivePlacementManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptivePlacementManifests(store: AdaptivePlacementManifestStore, query: AdaptivePlacementManifestQuery): AdaptivePlacementManifest[] {
  return query.apply(store.list());
}
