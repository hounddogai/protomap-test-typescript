import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionManifest } from "./conversion-manifest.js";

/** Keeps conversion manifests by code. */
export interface ConversionManifestStore {
  find(code: string): ConversionManifest | undefined;
  save(item: ConversionManifest): void;
  remove(code: string): boolean;
  list(): ConversionManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionManifestStore implements ConversionManifestStore {
  items: Map<string, ConversionManifest>;
  order: string[];

  constructor(items: Map<string, ConversionManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionManifest): void {
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

  list(): ConversionManifest[] {
    const out: ConversionManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionManifestStore(): ConversionManifestStore {
  return new MemoryConversionManifestStore(new Map<string, ConversionManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionManifestStore implements ConversionManifestStore {
  inner: ConversionManifestStore;
  cache: cache.TtlCache<ConversionManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionManifestStore,
    cacheValue: cache.TtlCache<ConversionManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionManifest | undefined {
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

  save(item: ConversionManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionManifest[] {
    return this.inner.list();
  }
}

export function newCachedConversionManifestStore(inner: ConversionManifestStore, ttl: number, clockValue: clock.Clock): ConversionManifestStore {
  return new CachedConversionManifestStore(inner, cache.newTtlCache<ConversionManifest>(64, ttl, clockValue), 0, 0);
}

/** Selects conversion manifests. Empty fields match all. */
export class ConversionManifestQuery {
  segment: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minRate: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionManifest): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionManifest[]): ConversionManifest[] {
    const matched = collections.filter(items, (candidate: ConversionManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionManifests(store: ConversionManifestStore, query: ConversionManifestQuery): ConversionManifest[] {
  return query.apply(store.list());
}
