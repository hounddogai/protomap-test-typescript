import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TouchpointManifest } from "./touchpoint-manifest.js";

/** Keeps touchpoint manifests by code. */
export interface TouchpointManifestStore {
  find(code: string): TouchpointManifest | undefined;
  save(item: TouchpointManifest): void;
  remove(code: string): boolean;
  list(): TouchpointManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTouchpointManifestStore implements TouchpointManifestStore {
  items: Map<string, TouchpointManifest>;
  order: string[];

  constructor(items: Map<string, TouchpointManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TouchpointManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TouchpointManifest): void {
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

  list(): TouchpointManifest[] {
    const out: TouchpointManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTouchpointManifestStore(): TouchpointManifestStore {
  return new MemoryTouchpointManifestStore(new Map<string, TouchpointManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTouchpointManifestStore implements TouchpointManifestStore {
  inner: TouchpointManifestStore;
  cache: cache.TtlCache<TouchpointManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: TouchpointManifestStore,
    cacheValue: cache.TtlCache<TouchpointManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TouchpointManifest | undefined {
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

  save(item: TouchpointManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TouchpointManifest[] {
    return this.inner.list();
  }
}

export function newCachedTouchpointManifestStore(inner: TouchpointManifestStore, ttl: number, clockValue: clock.Clock): TouchpointManifestStore {
  return new CachedTouchpointManifestStore(inner, cache.newTtlCache<TouchpointManifest>(1024, ttl, clockValue), 0, 0);
}

/** Selects touchpoint manifests. Empty fields match all. */
export class TouchpointManifestQuery {
  name: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMaximum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TouchpointManifest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TouchpointManifest[]): TouchpointManifest[] {
    const matched = collections.filter(items, (candidate: TouchpointManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTouchpointManifests(store: TouchpointManifestStore, query: TouchpointManifestQuery): TouchpointManifest[] {
  return query.apply(store.list());
}
