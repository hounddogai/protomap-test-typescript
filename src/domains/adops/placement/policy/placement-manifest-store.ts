import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementManifest } from "./placement-manifest.js";

/** Keeps placement manifests by code. */
export interface PlacementManifestStore {
  find(code: string): PlacementManifest | undefined;
  save(item: PlacementManifest): void;
  remove(code: string): boolean;
  list(): PlacementManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementManifestStore implements PlacementManifestStore {
  items: Map<string, PlacementManifest>;
  order: string[];

  constructor(items: Map<string, PlacementManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementManifest): void {
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

  list(): PlacementManifest[] {
    const out: PlacementManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementManifestStore(): PlacementManifestStore {
  return new MemoryPlacementManifestStore(new Map<string, PlacementManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementManifestStore implements PlacementManifestStore {
  inner: PlacementManifestStore;
  cache: cache.TtlCache<PlacementManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementManifestStore,
    cacheValue: cache.TtlCache<PlacementManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementManifest | undefined {
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

  save(item: PlacementManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementManifest[] {
    return this.inner.list();
  }
}

export function newCachedPlacementManifestStore(inner: PlacementManifestStore, ttl: number, clockValue: clock.Clock): PlacementManifestStore {
  return new CachedPlacementManifestStore(inner, cache.newTtlCache<PlacementManifest>(512, ttl, clockValue), 0, 0);
}

/** Selects placement manifests. Empty fields match all. */
export class PlacementManifestQuery {
  title: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minLimit: number, statuses: string[], limit: number) {
    this.title = title;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementManifest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementManifest[]): PlacementManifest[] {
    const matched = collections.filter(items, (candidate: PlacementManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementManifests(store: PlacementManifestStore, query: PlacementManifestQuery): PlacementManifest[] {
  return query.apply(store.list());
}
