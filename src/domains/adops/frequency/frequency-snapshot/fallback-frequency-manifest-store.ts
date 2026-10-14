import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackFrequencyManifest } from "./fallback-frequency-manifest.js";

/** Keeps fallback frequency manifests by code. */
export interface FallbackFrequencyManifestStore {
  find(code: string): FallbackFrequencyManifest | undefined;
  save(item: FallbackFrequencyManifest): void;
  remove(code: string): boolean;
  list(): FallbackFrequencyManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackFrequencyManifestStore implements FallbackFrequencyManifestStore {
  items: Map<string, FallbackFrequencyManifest>;
  order: string[];

  constructor(items: Map<string, FallbackFrequencyManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackFrequencyManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackFrequencyManifest): void {
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

  list(): FallbackFrequencyManifest[] {
    const out: FallbackFrequencyManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackFrequencyManifestStore(): FallbackFrequencyManifestStore {
  return new MemoryFallbackFrequencyManifestStore(new Map<string, FallbackFrequencyManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackFrequencyManifestStore implements FallbackFrequencyManifestStore {
  inner: FallbackFrequencyManifestStore;
  cache: cache.TtlCache<FallbackFrequencyManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackFrequencyManifestStore,
    cacheValue: cache.TtlCache<FallbackFrequencyManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackFrequencyManifest | undefined {
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

  save(item: FallbackFrequencyManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackFrequencyManifest[] {
    return this.inner.list();
  }
}

export function newCachedFallbackFrequencyManifestStore(inner: FallbackFrequencyManifestStore, ttl: number, clockValue: clock.Clock): FallbackFrequencyManifestStore {
  return new CachedFallbackFrequencyManifestStore(
    inner,
    cache.newTtlCache<FallbackFrequencyManifest>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback frequency manifests. Empty fields match all. */
export class FallbackFrequencyManifestQuery {
  utmSource: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackFrequencyManifest): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackFrequencyManifest[]): FallbackFrequencyManifest[] {
    const matched = collections.filter(items, (candidate: FallbackFrequencyManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackFrequencyManifests(store: FallbackFrequencyManifestStore, query: FallbackFrequencyManifestQuery): FallbackFrequencyManifest[] {
  return query.apply(store.list());
}
