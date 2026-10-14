import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionManifest } from "./retention-manifest.js";

/** Keeps retention manifests by code. */
export interface RetentionManifestStore {
  find(code: string): RetentionManifest | undefined;
  save(item: RetentionManifest): void;
  remove(code: string): boolean;
  list(): RetentionManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionManifestStore implements RetentionManifestStore {
  items: Map<string, RetentionManifest>;
  order: string[];

  constructor(items: Map<string, RetentionManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionManifest): void {
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

  list(): RetentionManifest[] {
    const out: RetentionManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionManifestStore(): RetentionManifestStore {
  return new MemoryRetentionManifestStore(new Map<string, RetentionManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionManifestStore implements RetentionManifestStore {
  inner: RetentionManifestStore;
  cache: cache.TtlCache<RetentionManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionManifestStore,
    cacheValue: cache.TtlCache<RetentionManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionManifest | undefined {
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

  save(item: RetentionManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionManifest[] {
    return this.inner.list();
  }
}

export function newCachedRetentionManifestStore(inner: RetentionManifestStore, ttl: number, clockValue: clock.Clock): RetentionManifestStore {
  return new CachedRetentionManifestStore(inner, cache.newTtlCache<RetentionManifest>(256, ttl, clockValue), 0, 0);
}

/** Selects retention manifests. Empty fields match all. */
export class RetentionManifestQuery {
  unit: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minDiscount: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionManifest): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionManifest[]): RetentionManifest[] {
    const matched = collections.filter(items, (candidate: RetentionManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionManifests(store: RetentionManifestStore, query: RetentionManifestQuery): RetentionManifest[] {
  return query.apply(store.list());
}
