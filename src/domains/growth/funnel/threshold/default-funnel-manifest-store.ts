import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultFunnelManifest } from "./default-funnel-manifest.js";

/** Keeps default funnel manifests by code. */
export interface DefaultFunnelManifestStore {
  find(code: string): DefaultFunnelManifest | undefined;
  save(item: DefaultFunnelManifest): void;
  remove(code: string): boolean;
  list(): DefaultFunnelManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultFunnelManifestStore implements DefaultFunnelManifestStore {
  items: Map<string, DefaultFunnelManifest>;
  order: string[];

  constructor(items: Map<string, DefaultFunnelManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultFunnelManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultFunnelManifest): void {
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

  list(): DefaultFunnelManifest[] {
    const out: DefaultFunnelManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultFunnelManifestStore(): DefaultFunnelManifestStore {
  return new MemoryDefaultFunnelManifestStore(new Map<string, DefaultFunnelManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultFunnelManifestStore implements DefaultFunnelManifestStore {
  inner: DefaultFunnelManifestStore;
  cache: cache.TtlCache<DefaultFunnelManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultFunnelManifestStore,
    cacheValue: cache.TtlCache<DefaultFunnelManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultFunnelManifest | undefined {
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

  save(item: DefaultFunnelManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultFunnelManifest[] {
    return this.inner.list();
  }
}

export function newCachedDefaultFunnelManifestStore(inner: DefaultFunnelManifestStore, ttl: number, clockValue: clock.Clock): DefaultFunnelManifestStore {
  return new CachedDefaultFunnelManifestStore(
    inner,
    cache.newTtlCache<DefaultFunnelManifest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default funnel manifests. Empty fields match all. */
export class DefaultFunnelManifestQuery {
  name: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultFunnelManifest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultFunnelManifest[]): DefaultFunnelManifest[] {
    const matched = collections.filter(items, (candidate: DefaultFunnelManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultFunnelManifests(store: DefaultFunnelManifestStore, query: DefaultFunnelManifestQuery): DefaultFunnelManifest[] {
  return query.apply(store.list());
}
