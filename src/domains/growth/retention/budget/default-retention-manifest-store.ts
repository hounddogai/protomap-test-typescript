import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultRetentionManifest } from "./default-retention-manifest.js";

/** Keeps default retention manifests by code. */
export interface DefaultRetentionManifestStore {
  find(code: string): DefaultRetentionManifest | undefined;
  save(item: DefaultRetentionManifest): void;
  remove(code: string): boolean;
  list(): DefaultRetentionManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultRetentionManifestStore implements DefaultRetentionManifestStore {
  items: Map<string, DefaultRetentionManifest>;
  order: string[];

  constructor(items: Map<string, DefaultRetentionManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultRetentionManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultRetentionManifest): void {
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

  list(): DefaultRetentionManifest[] {
    const out: DefaultRetentionManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultRetentionManifestStore(): DefaultRetentionManifestStore {
  return new MemoryDefaultRetentionManifestStore(new Map<string, DefaultRetentionManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultRetentionManifestStore implements DefaultRetentionManifestStore {
  inner: DefaultRetentionManifestStore;
  cache: cache.TtlCache<DefaultRetentionManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultRetentionManifestStore,
    cacheValue: cache.TtlCache<DefaultRetentionManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultRetentionManifest | undefined {
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

  save(item: DefaultRetentionManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultRetentionManifest[] {
    return this.inner.list();
  }
}

export function newCachedDefaultRetentionManifestStore(inner: DefaultRetentionManifestStore, ttl: number, clockValue: clock.Clock): DefaultRetentionManifestStore {
  return new CachedDefaultRetentionManifestStore(
    inner,
    cache.newTtlCache<DefaultRetentionManifest>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default retention manifests. Empty fields match all. */
export class DefaultRetentionManifestQuery {
  label: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minVersion: number, statuses: string[], limit: number) {
    this.label = label;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultRetentionManifest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultRetentionManifest[]): DefaultRetentionManifest[] {
    const matched = collections.filter(items, (candidate: DefaultRetentionManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultRetentionManifests(store: DefaultRetentionManifestStore, query: DefaultRetentionManifestQuery): DefaultRetentionManifest[] {
  return query.apply(store.list());
}
