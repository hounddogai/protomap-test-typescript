import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveFrequencyManifest } from "./adaptive-frequency-manifest.js";

/** Keeps adaptive frequency manifests by code. */
export interface AdaptiveFrequencyManifestStore {
  find(code: string): AdaptiveFrequencyManifest | undefined;
  save(item: AdaptiveFrequencyManifest): void;
  remove(code: string): boolean;
  list(): AdaptiveFrequencyManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveFrequencyManifestStore implements AdaptiveFrequencyManifestStore {
  items: Map<string, AdaptiveFrequencyManifest>;
  order: string[];

  constructor(items: Map<string, AdaptiveFrequencyManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveFrequencyManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveFrequencyManifest): void {
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

  list(): AdaptiveFrequencyManifest[] {
    const out: AdaptiveFrequencyManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveFrequencyManifestStore(): AdaptiveFrequencyManifestStore {
  return new MemoryAdaptiveFrequencyManifestStore(new Map<string, AdaptiveFrequencyManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveFrequencyManifestStore implements AdaptiveFrequencyManifestStore {
  inner: AdaptiveFrequencyManifestStore;
  cache: cache.TtlCache<AdaptiveFrequencyManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveFrequencyManifestStore,
    cacheValue: cache.TtlCache<AdaptiveFrequencyManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveFrequencyManifest | undefined {
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

  save(item: AdaptiveFrequencyManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveFrequencyManifest[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveFrequencyManifestStore(inner: AdaptiveFrequencyManifestStore, ttl: number, clockValue: clock.Clock): AdaptiveFrequencyManifestStore {
  return new CachedAdaptiveFrequencyManifestStore(
    inner,
    cache.newTtlCache<AdaptiveFrequencyManifest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive frequency manifests. Empty fields match all. */
export class AdaptiveFrequencyManifestQuery {
  label: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minThreshold: number, statuses: string[], limit: number) {
    this.label = label;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveFrequencyManifest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveFrequencyManifest[]): AdaptiveFrequencyManifest[] {
    const matched = collections.filter(items, (candidate: AdaptiveFrequencyManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveFrequencyManifests(store: AdaptiveFrequencyManifestStore, query: AdaptiveFrequencyManifestQuery): AdaptiveFrequencyManifest[] {
  return query.apply(store.list());
}
