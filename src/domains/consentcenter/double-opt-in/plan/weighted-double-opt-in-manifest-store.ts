import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedDoubleOptInManifest } from "./weighted-double-opt-in-manifest.js";

/** Keeps weighted double opt in manifests by code. */
export interface WeightedDoubleOptInManifestStore {
  find(code: string): WeightedDoubleOptInManifest | undefined;
  save(item: WeightedDoubleOptInManifest): void;
  remove(code: string): boolean;
  list(): WeightedDoubleOptInManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedDoubleOptInManifestStore implements WeightedDoubleOptInManifestStore {
  items: Map<string, WeightedDoubleOptInManifest>;
  order: string[];

  constructor(items: Map<string, WeightedDoubleOptInManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedDoubleOptInManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedDoubleOptInManifest): void {
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

  list(): WeightedDoubleOptInManifest[] {
    const out: WeightedDoubleOptInManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedDoubleOptInManifestStore(): WeightedDoubleOptInManifestStore {
  return new MemoryWeightedDoubleOptInManifestStore(new Map<string, WeightedDoubleOptInManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedDoubleOptInManifestStore implements WeightedDoubleOptInManifestStore {
  inner: WeightedDoubleOptInManifestStore;
  cache: cache.TtlCache<WeightedDoubleOptInManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedDoubleOptInManifestStore,
    cacheValue: cache.TtlCache<WeightedDoubleOptInManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedDoubleOptInManifest | undefined {
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

  save(item: WeightedDoubleOptInManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedDoubleOptInManifest[] {
    return this.inner.list();
  }
}

export function newCachedWeightedDoubleOptInManifestStore(inner: WeightedDoubleOptInManifestStore, ttl: number, clockValue: clock.Clock): WeightedDoubleOptInManifestStore {
  return new CachedWeightedDoubleOptInManifestStore(
    inner,
    cache.newTtlCache<WeightedDoubleOptInManifest>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted double opt in manifests. Empty fields match all. */
export class WeightedDoubleOptInManifestQuery {
  channel: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRevision: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedDoubleOptInManifest): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedDoubleOptInManifest[]): WeightedDoubleOptInManifest[] {
    const matched = collections.filter(items, (candidate: WeightedDoubleOptInManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedDoubleOptInManifests(store: WeightedDoubleOptInManifestStore, query: WeightedDoubleOptInManifestQuery): WeightedDoubleOptInManifest[] {
  return query.apply(store.list());
}
