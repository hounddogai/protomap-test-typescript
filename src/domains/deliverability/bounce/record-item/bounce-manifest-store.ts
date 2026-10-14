import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceManifest } from "./bounce-manifest.js";

/** Keeps bounce manifests by code. */
export interface BounceManifestStore {
  find(code: string): BounceManifest | undefined;
  save(item: BounceManifest): void;
  remove(code: string): boolean;
  list(): BounceManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceManifestStore implements BounceManifestStore {
  items: Map<string, BounceManifest>;
  order: string[];

  constructor(items: Map<string, BounceManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceManifest): void {
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

  list(): BounceManifest[] {
    const out: BounceManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceManifestStore(): BounceManifestStore {
  return new MemoryBounceManifestStore(new Map<string, BounceManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceManifestStore implements BounceManifestStore {
  inner: BounceManifestStore;
  cache: cache.TtlCache<BounceManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: BounceManifestStore,
    cacheValue: cache.TtlCache<BounceManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceManifest | undefined {
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

  save(item: BounceManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceManifest[] {
    return this.inner.list();
  }
}

export function newCachedBounceManifestStore(inner: BounceManifestStore, ttl: number, clockValue: clock.Clock): BounceManifestStore {
  return new CachedBounceManifestStore(inner, cache.newTtlCache<BounceManifest>(256, ttl, clockValue), 0, 0);
}

/** Selects bounce manifests. Empty fields match all. */
export class BounceManifestQuery {
  unit: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minRate: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceManifest): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceManifest[]): BounceManifest[] {
    const matched = collections.filter(items, (candidate: BounceManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceManifests(store: BounceManifestStore, query: BounceManifestQuery): BounceManifest[] {
  return query.apply(store.list());
}
