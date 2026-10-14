import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalFunnelManifest } from "./seasonal-funnel-manifest.js";

/** Keeps seasonal funnel manifests by code. */
export interface SeasonalFunnelManifestStore {
  find(code: string): SeasonalFunnelManifest | undefined;
  save(item: SeasonalFunnelManifest): void;
  remove(code: string): boolean;
  list(): SeasonalFunnelManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalFunnelManifestStore implements SeasonalFunnelManifestStore {
  items: Map<string, SeasonalFunnelManifest>;
  order: string[];

  constructor(items: Map<string, SeasonalFunnelManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalFunnelManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalFunnelManifest): void {
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

  list(): SeasonalFunnelManifest[] {
    const out: SeasonalFunnelManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalFunnelManifestStore(): SeasonalFunnelManifestStore {
  return new MemorySeasonalFunnelManifestStore(new Map<string, SeasonalFunnelManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalFunnelManifestStore implements SeasonalFunnelManifestStore {
  inner: SeasonalFunnelManifestStore;
  cache: cache.TtlCache<SeasonalFunnelManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalFunnelManifestStore,
    cacheValue: cache.TtlCache<SeasonalFunnelManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalFunnelManifest | undefined {
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

  save(item: SeasonalFunnelManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalFunnelManifest[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalFunnelManifestStore(inner: SeasonalFunnelManifestStore, ttl: number, clockValue: clock.Clock): SeasonalFunnelManifestStore {
  return new CachedSeasonalFunnelManifestStore(
    inner,
    cache.newTtlCache<SeasonalFunnelManifest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal funnel manifests. Empty fields match all. */
export class SeasonalFunnelManifestQuery {
  title: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalFunnelManifest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalFunnelManifest[]): SeasonalFunnelManifest[] {
    const matched = collections.filter(items, (candidate: SeasonalFunnelManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalFunnelManifests(store: SeasonalFunnelManifestStore, query: SeasonalFunnelManifestQuery): SeasonalFunnelManifest[] {
  return query.apply(store.list());
}
