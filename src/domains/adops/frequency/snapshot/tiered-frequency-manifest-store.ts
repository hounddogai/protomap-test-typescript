import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredFrequencyManifest } from "./tiered-frequency-manifest.js";

/** Keeps tiered frequency manifests by code. */
export interface TieredFrequencyManifestStore {
  find(code: string): TieredFrequencyManifest | undefined;
  save(item: TieredFrequencyManifest): void;
  remove(code: string): boolean;
  list(): TieredFrequencyManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredFrequencyManifestStore implements TieredFrequencyManifestStore {
  items: Map<string, TieredFrequencyManifest>;
  order: string[];

  constructor(items: Map<string, TieredFrequencyManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredFrequencyManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredFrequencyManifest): void {
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

  list(): TieredFrequencyManifest[] {
    const out: TieredFrequencyManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredFrequencyManifestStore(): TieredFrequencyManifestStore {
  return new MemoryTieredFrequencyManifestStore(new Map<string, TieredFrequencyManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredFrequencyManifestStore implements TieredFrequencyManifestStore {
  inner: TieredFrequencyManifestStore;
  cache: cache.TtlCache<TieredFrequencyManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredFrequencyManifestStore,
    cacheValue: cache.TtlCache<TieredFrequencyManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredFrequencyManifest | undefined {
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

  save(item: TieredFrequencyManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredFrequencyManifest[] {
    return this.inner.list();
  }
}

export function newCachedTieredFrequencyManifestStore(inner: TieredFrequencyManifestStore, ttl: number, clockValue: clock.Clock): TieredFrequencyManifestStore {
  return new CachedTieredFrequencyManifestStore(
    inner,
    cache.newTtlCache<TieredFrequencyManifest>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered frequency manifests. Empty fields match all. */
export class TieredFrequencyManifestQuery {
  source: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minAttempts: number, statuses: string[], limit: number) {
    this.source = source;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredFrequencyManifest): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredFrequencyManifest[]): TieredFrequencyManifest[] {
    const matched = collections.filter(items, (candidate: TieredFrequencyManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredFrequencyManifests(store: TieredFrequencyManifestStore, query: TieredFrequencyManifestQuery): TieredFrequencyManifest[] {
  return query.apply(store.list());
}
