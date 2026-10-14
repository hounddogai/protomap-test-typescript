import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientDeflectionManifest } from "./lenient-deflection-manifest.js";

/** Keeps lenient deflection manifests by code. */
export interface LenientDeflectionManifestStore {
  find(code: string): LenientDeflectionManifest | undefined;
  save(item: LenientDeflectionManifest): void;
  remove(code: string): boolean;
  list(): LenientDeflectionManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientDeflectionManifestStore implements LenientDeflectionManifestStore {
  items: Map<string, LenientDeflectionManifest>;
  order: string[];

  constructor(items: Map<string, LenientDeflectionManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientDeflectionManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientDeflectionManifest): void {
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

  list(): LenientDeflectionManifest[] {
    const out: LenientDeflectionManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientDeflectionManifestStore(): LenientDeflectionManifestStore {
  return new MemoryLenientDeflectionManifestStore(new Map<string, LenientDeflectionManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientDeflectionManifestStore implements LenientDeflectionManifestStore {
  inner: LenientDeflectionManifestStore;
  cache: cache.TtlCache<LenientDeflectionManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientDeflectionManifestStore,
    cacheValue: cache.TtlCache<LenientDeflectionManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientDeflectionManifest | undefined {
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

  save(item: LenientDeflectionManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientDeflectionManifest[] {
    return this.inner.list();
  }
}

export function newCachedLenientDeflectionManifestStore(inner: LenientDeflectionManifestStore, ttl: number, clockValue: clock.Clock): LenientDeflectionManifestStore {
  return new CachedLenientDeflectionManifestStore(
    inner,
    cache.newTtlCache<LenientDeflectionManifest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient deflection manifests. Empty fields match all. */
export class LenientDeflectionManifestQuery {
  name: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMargin: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientDeflectionManifest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientDeflectionManifest[]): LenientDeflectionManifest[] {
    const matched = collections.filter(items, (candidate: LenientDeflectionManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientDeflectionManifests(store: LenientDeflectionManifestStore, query: LenientDeflectionManifestQuery): LenientDeflectionManifest[] {
  return query.apply(store.list());
}
