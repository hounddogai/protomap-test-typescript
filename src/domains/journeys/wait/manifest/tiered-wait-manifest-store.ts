import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredWaitManifest } from "./tiered-wait-manifest.js";

/** Keeps tiered wait manifests by code. */
export interface TieredWaitManifestStore {
  find(code: string): TieredWaitManifest | undefined;
  save(item: TieredWaitManifest): void;
  remove(code: string): boolean;
  list(): TieredWaitManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredWaitManifestStore implements TieredWaitManifestStore {
  items: Map<string, TieredWaitManifest>;
  order: string[];

  constructor(items: Map<string, TieredWaitManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredWaitManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredWaitManifest): void {
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

  list(): TieredWaitManifest[] {
    const out: TieredWaitManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredWaitManifestStore(): TieredWaitManifestStore {
  return new MemoryTieredWaitManifestStore(new Map<string, TieredWaitManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredWaitManifestStore implements TieredWaitManifestStore {
  inner: TieredWaitManifestStore;
  cache: cache.TtlCache<TieredWaitManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredWaitManifestStore,
    cacheValue: cache.TtlCache<TieredWaitManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredWaitManifest | undefined {
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

  save(item: TieredWaitManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredWaitManifest[] {
    return this.inner.list();
  }
}

export function newCachedTieredWaitManifestStore(inner: TieredWaitManifestStore, ttl: number, clockValue: clock.Clock): TieredWaitManifestStore {
  return new CachedTieredWaitManifestStore(inner, cache.newTtlCache<TieredWaitManifest>(512, ttl, clockValue), 0, 0);
}

/** Selects tiered wait manifests. Empty fields match all. */
export class TieredWaitManifestQuery {
  label: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minImpressions: number, statuses: string[], limit: number) {
    this.label = label;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredWaitManifest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredWaitManifest[]): TieredWaitManifest[] {
    const matched = collections.filter(items, (candidate: TieredWaitManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredWaitManifests(store: TieredWaitManifestStore, query: TieredWaitManifestQuery): TieredWaitManifest[] {
  return query.apply(store.list());
}
