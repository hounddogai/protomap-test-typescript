import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeManifest } from "./creative-manifest.js";

/** Keeps creative manifests by code. */
export interface CreativeManifestStore {
  find(code: string): CreativeManifest | undefined;
  save(item: CreativeManifest): void;
  remove(code: string): boolean;
  list(): CreativeManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeManifestStore implements CreativeManifestStore {
  items: Map<string, CreativeManifest>;
  order: string[];

  constructor(items: Map<string, CreativeManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeManifest): void {
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

  list(): CreativeManifest[] {
    const out: CreativeManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeManifestStore(): CreativeManifestStore {
  return new MemoryCreativeManifestStore(new Map<string, CreativeManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeManifestStore implements CreativeManifestStore {
  inner: CreativeManifestStore;
  cache: cache.TtlCache<CreativeManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: CreativeManifestStore,
    cacheValue: cache.TtlCache<CreativeManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeManifest | undefined {
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

  save(item: CreativeManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeManifest[] {
    return this.inner.list();
  }
}

export function newCachedCreativeManifestStore(inner: CreativeManifestStore, ttl: number, clockValue: clock.Clock): CreativeManifestStore {
  return new CachedCreativeManifestStore(inner, cache.newTtlCache<CreativeManifest>(256, ttl, clockValue), 0, 0);
}

/** Selects creative manifests. Empty fields match all. */
export class CreativeManifestQuery {
  segment: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minCost: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeManifest): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeManifest[]): CreativeManifest[] {
    const matched = collections.filter(items, (candidate: CreativeManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeManifests(store: CreativeManifestStore, query: CreativeManifestQuery): CreativeManifest[] {
  return query.apply(store.list());
}
