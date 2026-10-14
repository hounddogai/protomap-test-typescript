import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualFunnelManifest } from "./manual-funnel-manifest.js";

/** Keeps manual funnel manifests by code. */
export interface ManualFunnelManifestStore {
  find(code: string): ManualFunnelManifest | undefined;
  save(item: ManualFunnelManifest): void;
  remove(code: string): boolean;
  list(): ManualFunnelManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualFunnelManifestStore implements ManualFunnelManifestStore {
  items: Map<string, ManualFunnelManifest>;
  order: string[];

  constructor(items: Map<string, ManualFunnelManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualFunnelManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualFunnelManifest): void {
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

  list(): ManualFunnelManifest[] {
    const out: ManualFunnelManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualFunnelManifestStore(): ManualFunnelManifestStore {
  return new MemoryManualFunnelManifestStore(new Map<string, ManualFunnelManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualFunnelManifestStore implements ManualFunnelManifestStore {
  inner: ManualFunnelManifestStore;
  cache: cache.TtlCache<ManualFunnelManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualFunnelManifestStore,
    cacheValue: cache.TtlCache<ManualFunnelManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualFunnelManifest | undefined {
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

  save(item: ManualFunnelManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualFunnelManifest[] {
    return this.inner.list();
  }
}

export function newCachedManualFunnelManifestStore(inner: ManualFunnelManifestStore, ttl: number, clockValue: clock.Clock): ManualFunnelManifestStore {
  return new CachedManualFunnelManifestStore(
    inner,
    cache.newTtlCache<ManualFunnelManifest>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual funnel manifests. Empty fields match all. */
export class ManualFunnelManifestQuery {
  category: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minCapacity: number, statuses: string[], limit: number) {
    this.category = category;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualFunnelManifest): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualFunnelManifest[]): ManualFunnelManifest[] {
    const matched = collections.filter(items, (candidate: ManualFunnelManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualFunnelManifests(store: ManualFunnelManifestStore, query: ManualFunnelManifestQuery): ManualFunnelManifest[] {
  return query.apply(store.list());
}
