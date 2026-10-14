import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackWarmupManifest } from "./fallback-warmup-manifest.js";

/** Keeps fallback warmup manifests by code. */
export interface FallbackWarmupManifestStore {
  find(code: string): FallbackWarmupManifest | undefined;
  save(item: FallbackWarmupManifest): void;
  remove(code: string): boolean;
  list(): FallbackWarmupManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackWarmupManifestStore implements FallbackWarmupManifestStore {
  items: Map<string, FallbackWarmupManifest>;
  order: string[];

  constructor(items: Map<string, FallbackWarmupManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackWarmupManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackWarmupManifest): void {
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

  list(): FallbackWarmupManifest[] {
    const out: FallbackWarmupManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackWarmupManifestStore(): FallbackWarmupManifestStore {
  return new MemoryFallbackWarmupManifestStore(new Map<string, FallbackWarmupManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackWarmupManifestStore implements FallbackWarmupManifestStore {
  inner: FallbackWarmupManifestStore;
  cache: cache.TtlCache<FallbackWarmupManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackWarmupManifestStore,
    cacheValue: cache.TtlCache<FallbackWarmupManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackWarmupManifest | undefined {
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

  save(item: FallbackWarmupManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackWarmupManifest[] {
    return this.inner.list();
  }
}

export function newCachedFallbackWarmupManifestStore(inner: FallbackWarmupManifestStore, ttl: number, clockValue: clock.Clock): FallbackWarmupManifestStore {
  return new CachedFallbackWarmupManifestStore(
    inner,
    cache.newTtlCache<FallbackWarmupManifest>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback warmup manifests. Empty fields match all. */
export class FallbackWarmupManifestQuery {
  unit: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minWindowDays: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackWarmupManifest): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackWarmupManifest[]): FallbackWarmupManifest[] {
    const matched = collections.filter(items, (candidate: FallbackWarmupManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackWarmupManifests(store: FallbackWarmupManifestStore, query: FallbackWarmupManifestQuery): FallbackWarmupManifest[] {
  return query.apply(store.list());
}
