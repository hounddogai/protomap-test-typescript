import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathManifest } from "./path-manifest.js";

/** Keeps path manifests by code. */
export interface PathManifestStore {
  find(code: string): PathManifest | undefined;
  save(item: PathManifest): void;
  remove(code: string): boolean;
  list(): PathManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathManifestStore implements PathManifestStore {
  items: Map<string, PathManifest>;
  order: string[];

  constructor(items: Map<string, PathManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathManifest): void {
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

  list(): PathManifest[] {
    const out: PathManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathManifestStore(): PathManifestStore {
  return new MemoryPathManifestStore(new Map<string, PathManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathManifestStore implements PathManifestStore {
  inner: PathManifestStore;
  cache: cache.TtlCache<PathManifest>;
  hits: number;
  misses: number;

  constructor(inner: PathManifestStore, cacheValue: cache.TtlCache<PathManifest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathManifest | undefined {
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

  save(item: PathManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathManifest[] {
    return this.inner.list();
  }
}

export function newCachedPathManifestStore(inner: PathManifestStore, ttl: number, clockValue: clock.Clock): PathManifestStore {
  return new CachedPathManifestStore(inner, cache.newTtlCache<PathManifest>(128, ttl, clockValue), 0, 0);
}

/** Selects path manifests. Empty fields match all. */
export class PathManifestQuery {
  unit: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minDiscount: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathManifest): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathManifest[]): PathManifest[] {
    const matched = collections.filter(items, (candidate: PathManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathManifests(store: PathManifestStore, query: PathManifestQuery): PathManifest[] {
  return query.apply(store.list());
}
