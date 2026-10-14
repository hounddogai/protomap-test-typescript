import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingWindowManifest } from "./pending-window-manifest.js";

/** Keeps pending window manifests by code. */
export interface PendingWindowManifestStore {
  find(code: string): PendingWindowManifest | undefined;
  save(item: PendingWindowManifest): void;
  remove(code: string): boolean;
  list(): PendingWindowManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingWindowManifestStore implements PendingWindowManifestStore {
  items: Map<string, PendingWindowManifest>;
  order: string[];

  constructor(items: Map<string, PendingWindowManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingWindowManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingWindowManifest): void {
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

  list(): PendingWindowManifest[] {
    const out: PendingWindowManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingWindowManifestStore(): PendingWindowManifestStore {
  return new MemoryPendingWindowManifestStore(new Map<string, PendingWindowManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingWindowManifestStore implements PendingWindowManifestStore {
  inner: PendingWindowManifestStore;
  cache: cache.TtlCache<PendingWindowManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingWindowManifestStore,
    cacheValue: cache.TtlCache<PendingWindowManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingWindowManifest | undefined {
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

  save(item: PendingWindowManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingWindowManifest[] {
    return this.inner.list();
  }
}

export function newCachedPendingWindowManifestStore(inner: PendingWindowManifestStore, ttl: number, clockValue: clock.Clock): PendingWindowManifestStore {
  return new CachedPendingWindowManifestStore(
    inner,
    cache.newTtlCache<PendingWindowManifest>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending window manifests. Empty fields match all. */
export class PendingWindowManifestQuery {
  locale: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minVersion: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingWindowManifest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingWindowManifest[]): PendingWindowManifest[] {
    const matched = collections.filter(items, (candidate: PendingWindowManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingWindowManifests(store: PendingWindowManifestStore, query: PendingWindowManifestQuery): PendingWindowManifest[] {
  return query.apply(store.list());
}
