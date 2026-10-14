import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatManifest } from "./csat-manifest.js";

/** Keeps csat manifests by code. */
export interface CsatManifestStore {
  find(code: string): CsatManifest | undefined;
  save(item: CsatManifest): void;
  remove(code: string): boolean;
  list(): CsatManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatManifestStore implements CsatManifestStore {
  items: Map<string, CsatManifest>;
  order: string[];

  constructor(items: Map<string, CsatManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatManifest): void {
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

  list(): CsatManifest[] {
    const out: CsatManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatManifestStore(): CsatManifestStore {
  return new MemoryCsatManifestStore(new Map<string, CsatManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatManifestStore implements CsatManifestStore {
  inner: CsatManifestStore;
  cache: cache.TtlCache<CsatManifest>;
  hits: number;
  misses: number;

  constructor(inner: CsatManifestStore, cacheValue: cache.TtlCache<CsatManifest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatManifest | undefined {
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

  save(item: CsatManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatManifest[] {
    return this.inner.list();
  }
}

export function newCachedCsatManifestStore(inner: CsatManifestStore, ttl: number, clockValue: clock.Clock): CsatManifestStore {
  return new CachedCsatManifestStore(inner, cache.newTtlCache<CsatManifest>(128, ttl, clockValue), 0, 0);
}

/** Selects csat manifests. Empty fields match all. */
export class CsatManifestQuery {
  label: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatManifest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatManifest[]): CsatManifest[] {
    const matched = collections.filter(items, (candidate: CsatManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatManifests(store: CsatManifestStore, query: CsatManifestQuery): CsatManifest[] {
  return query.apply(store.list());
}
