import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualTierManifest } from "./manual-tier-manifest.js";

/** Keeps manual tier manifests by code. */
export interface ManualTierManifestStore {
  find(code: string): ManualTierManifest | undefined;
  save(item: ManualTierManifest): void;
  remove(code: string): boolean;
  list(): ManualTierManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualTierManifestStore implements ManualTierManifestStore {
  items: Map<string, ManualTierManifest>;
  order: string[];

  constructor(items: Map<string, ManualTierManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualTierManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualTierManifest): void {
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

  list(): ManualTierManifest[] {
    const out: ManualTierManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualTierManifestStore(): ManualTierManifestStore {
  return new MemoryManualTierManifestStore(new Map<string, ManualTierManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualTierManifestStore implements ManualTierManifestStore {
  inner: ManualTierManifestStore;
  cache: cache.TtlCache<ManualTierManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualTierManifestStore,
    cacheValue: cache.TtlCache<ManualTierManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualTierManifest | undefined {
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

  save(item: ManualTierManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualTierManifest[] {
    return this.inner.list();
  }
}

export function newCachedManualTierManifestStore(inner: ManualTierManifestStore, ttl: number, clockValue: clock.Clock): ManualTierManifestStore {
  return new CachedManualTierManifestStore(inner, cache.newTtlCache<ManualTierManifest>(512, ttl, clockValue), 0, 0);
}

/** Selects manual tier manifests. Empty fields match all. */
export class ManualTierManifestQuery {
  label: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCost: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualTierManifest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualTierManifest[]): ManualTierManifest[] {
    const matched = collections.filter(items, (candidate: ManualTierManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualTierManifests(store: ManualTierManifestStore, query: ManualTierManifestQuery): ManualTierManifest[] {
  return query.apply(store.list());
}
