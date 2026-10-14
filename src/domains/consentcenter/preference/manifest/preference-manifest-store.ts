import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceManifest } from "./preference-manifest.js";

/** Keeps preference manifests by code. */
export interface PreferenceManifestStore {
  find(code: string): PreferenceManifest | undefined;
  save(item: PreferenceManifest): void;
  remove(code: string): boolean;
  list(): PreferenceManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceManifestStore implements PreferenceManifestStore {
  items: Map<string, PreferenceManifest>;
  order: string[];

  constructor(items: Map<string, PreferenceManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceManifest): void {
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

  list(): PreferenceManifest[] {
    const out: PreferenceManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceManifestStore(): PreferenceManifestStore {
  return new MemoryPreferenceManifestStore(new Map<string, PreferenceManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceManifestStore implements PreferenceManifestStore {
  inner: PreferenceManifestStore;
  cache: cache.TtlCache<PreferenceManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceManifestStore,
    cacheValue: cache.TtlCache<PreferenceManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceManifest | undefined {
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

  save(item: PreferenceManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceManifest[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceManifestStore(inner: PreferenceManifestStore, ttl: number, clockValue: clock.Clock): PreferenceManifestStore {
  return new CachedPreferenceManifestStore(inner, cache.newTtlCache<PreferenceManifest>(64, ttl, clockValue), 0, 0);
}

/** Selects preference manifests. Empty fields match all. */
export class PreferenceManifestQuery {
  title: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minLimit: number, statuses: string[], limit: number) {
    this.title = title;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferenceManifest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceManifest[]): PreferenceManifest[] {
    const matched = collections.filter(items, (candidate: PreferenceManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceManifests(store: PreferenceManifestStore, query: PreferenceManifestQuery): PreferenceManifest[] {
  return query.apply(store.list());
}
