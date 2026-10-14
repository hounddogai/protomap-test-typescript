import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionManifest } from "./suppression-manifest.js";

/** Keeps suppression manifests by code. */
export interface SuppressionManifestStore {
  find(code: string): SuppressionManifest | undefined;
  save(item: SuppressionManifest): void;
  remove(code: string): boolean;
  list(): SuppressionManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionManifestStore implements SuppressionManifestStore {
  items: Map<string, SuppressionManifest>;
  order: string[];

  constructor(items: Map<string, SuppressionManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionManifest): void {
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

  list(): SuppressionManifest[] {
    const out: SuppressionManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionManifestStore(): SuppressionManifestStore {
  return new MemorySuppressionManifestStore(new Map<string, SuppressionManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionManifestStore implements SuppressionManifestStore {
  inner: SuppressionManifestStore;
  cache: cache.TtlCache<SuppressionManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionManifestStore,
    cacheValue: cache.TtlCache<SuppressionManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionManifest | undefined {
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

  save(item: SuppressionManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionManifest[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionManifestStore(inner: SuppressionManifestStore, ttl: number, clockValue: clock.Clock): SuppressionManifestStore {
  return new CachedSuppressionManifestStore(inner, cache.newTtlCache<SuppressionManifest>(256, ttl, clockValue), 0, 0);
}

/** Selects suppression manifests. Empty fields match all. */
export class SuppressionManifestQuery {
  title: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBatchSize: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionManifest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionManifest[]): SuppressionManifest[] {
    const matched = collections.filter(items, (candidate: SuppressionManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionManifests(store: SuppressionManifestStore, query: SuppressionManifestQuery): SuppressionManifest[] {
  return query.apply(store.list());
}
