import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyDeflectionManifest } from "./legacy-deflection-manifest.js";

/** Keeps legacy deflection manifests by code. */
export interface LegacyDeflectionManifestStore {
  find(code: string): LegacyDeflectionManifest | undefined;
  save(item: LegacyDeflectionManifest): void;
  remove(code: string): boolean;
  list(): LegacyDeflectionManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyDeflectionManifestStore implements LegacyDeflectionManifestStore {
  items: Map<string, LegacyDeflectionManifest>;
  order: string[];

  constructor(items: Map<string, LegacyDeflectionManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyDeflectionManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyDeflectionManifest): void {
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

  list(): LegacyDeflectionManifest[] {
    const out: LegacyDeflectionManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyDeflectionManifestStore(): LegacyDeflectionManifestStore {
  return new MemoryLegacyDeflectionManifestStore(new Map<string, LegacyDeflectionManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyDeflectionManifestStore implements LegacyDeflectionManifestStore {
  inner: LegacyDeflectionManifestStore;
  cache: cache.TtlCache<LegacyDeflectionManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyDeflectionManifestStore,
    cacheValue: cache.TtlCache<LegacyDeflectionManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyDeflectionManifest | undefined {
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

  save(item: LegacyDeflectionManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyDeflectionManifest[] {
    return this.inner.list();
  }
}

export function newCachedLegacyDeflectionManifestStore(inner: LegacyDeflectionManifestStore, ttl: number, clockValue: clock.Clock): LegacyDeflectionManifestStore {
  return new CachedLegacyDeflectionManifestStore(
    inner,
    cache.newTtlCache<LegacyDeflectionManifest>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy deflection manifests. Empty fields match all. */
export class LegacyDeflectionManifestQuery {
  label: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minScore: number, statuses: string[], limit: number) {
    this.label = label;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyDeflectionManifest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyDeflectionManifest[]): LegacyDeflectionManifest[] {
    const matched = collections.filter(items, (candidate: LegacyDeflectionManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyDeflectionManifests(store: LegacyDeflectionManifestStore, query: LegacyDeflectionManifestQuery): LegacyDeflectionManifest[] {
  return query.apply(store.list());
}
