import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalTierManifest } from "./global-tier-manifest.js";

/** Keeps global tier manifests by code. */
export interface GlobalTierManifestStore {
  find(code: string): GlobalTierManifest | undefined;
  save(item: GlobalTierManifest): void;
  remove(code: string): boolean;
  list(): GlobalTierManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalTierManifestStore implements GlobalTierManifestStore {
  items: Map<string, GlobalTierManifest>;
  order: string[];

  constructor(items: Map<string, GlobalTierManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalTierManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalTierManifest): void {
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

  list(): GlobalTierManifest[] {
    const out: GlobalTierManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalTierManifestStore(): GlobalTierManifestStore {
  return new MemoryGlobalTierManifestStore(new Map<string, GlobalTierManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalTierManifestStore implements GlobalTierManifestStore {
  inner: GlobalTierManifestStore;
  cache: cache.TtlCache<GlobalTierManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalTierManifestStore,
    cacheValue: cache.TtlCache<GlobalTierManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalTierManifest | undefined {
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

  save(item: GlobalTierManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalTierManifest[] {
    return this.inner.list();
  }
}

export function newCachedGlobalTierManifestStore(inner: GlobalTierManifestStore, ttl: number, clockValue: clock.Clock): GlobalTierManifestStore {
  return new CachedGlobalTierManifestStore(inner, cache.newTtlCache<GlobalTierManifest>(128, ttl, clockValue), 0, 0);
}

/** Selects global tier manifests. Empty fields match all. */
export class GlobalTierManifestQuery {
  name: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDiscount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalTierManifest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalTierManifest[]): GlobalTierManifest[] {
    const matched = collections.filter(items, (candidate: GlobalTierManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalTierManifests(store: GlobalTierManifestStore, query: GlobalTierManifestQuery): GlobalTierManifest[] {
  return query.apply(store.list());
}
