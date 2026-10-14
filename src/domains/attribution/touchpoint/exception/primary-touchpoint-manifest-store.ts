import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryTouchpointManifest } from "./primary-touchpoint-manifest.js";

/** Keeps primary touchpoint manifests by code. */
export interface PrimaryTouchpointManifestStore {
  find(code: string): PrimaryTouchpointManifest | undefined;
  save(item: PrimaryTouchpointManifest): void;
  remove(code: string): boolean;
  list(): PrimaryTouchpointManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryTouchpointManifestStore implements PrimaryTouchpointManifestStore {
  items: Map<string, PrimaryTouchpointManifest>;
  order: string[];

  constructor(items: Map<string, PrimaryTouchpointManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryTouchpointManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryTouchpointManifest): void {
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

  list(): PrimaryTouchpointManifest[] {
    const out: PrimaryTouchpointManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryTouchpointManifestStore(): PrimaryTouchpointManifestStore {
  return new MemoryPrimaryTouchpointManifestStore(new Map<string, PrimaryTouchpointManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryTouchpointManifestStore implements PrimaryTouchpointManifestStore {
  inner: PrimaryTouchpointManifestStore;
  cache: cache.TtlCache<PrimaryTouchpointManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryTouchpointManifestStore,
    cacheValue: cache.TtlCache<PrimaryTouchpointManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryTouchpointManifest | undefined {
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

  save(item: PrimaryTouchpointManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryTouchpointManifest[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryTouchpointManifestStore(inner: PrimaryTouchpointManifestStore, ttl: number, clockValue: clock.Clock): PrimaryTouchpointManifestStore {
  return new CachedPrimaryTouchpointManifestStore(
    inner,
    cache.newTtlCache<PrimaryTouchpointManifest>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary touchpoint manifests. Empty fields match all. */
export class PrimaryTouchpointManifestQuery {
  category: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minOpenRate: number, statuses: string[], limit: number) {
    this.category = category;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryTouchpointManifest): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryTouchpointManifest[]): PrimaryTouchpointManifest[] {
    const matched = collections.filter(items, (candidate: PrimaryTouchpointManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryTouchpointManifests(store: PrimaryTouchpointManifestStore, query: PrimaryTouchpointManifestQuery): PrimaryTouchpointManifest[] {
  return query.apply(store.list());
}
