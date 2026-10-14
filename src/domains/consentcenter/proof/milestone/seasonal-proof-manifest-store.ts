import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalProofManifest } from "./seasonal-proof-manifest.js";

/** Keeps seasonal proof manifests by code. */
export interface SeasonalProofManifestStore {
  find(code: string): SeasonalProofManifest | undefined;
  save(item: SeasonalProofManifest): void;
  remove(code: string): boolean;
  list(): SeasonalProofManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalProofManifestStore implements SeasonalProofManifestStore {
  items: Map<string, SeasonalProofManifest>;
  order: string[];

  constructor(items: Map<string, SeasonalProofManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalProofManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalProofManifest): void {
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

  list(): SeasonalProofManifest[] {
    const out: SeasonalProofManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalProofManifestStore(): SeasonalProofManifestStore {
  return new MemorySeasonalProofManifestStore(new Map<string, SeasonalProofManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalProofManifestStore implements SeasonalProofManifestStore {
  inner: SeasonalProofManifestStore;
  cache: cache.TtlCache<SeasonalProofManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalProofManifestStore,
    cacheValue: cache.TtlCache<SeasonalProofManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalProofManifest | undefined {
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

  save(item: SeasonalProofManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalProofManifest[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalProofManifestStore(inner: SeasonalProofManifestStore, ttl: number, clockValue: clock.Clock): SeasonalProofManifestStore {
  return new CachedSeasonalProofManifestStore(
    inner,
    cache.newTtlCache<SeasonalProofManifest>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal proof manifests. Empty fields match all. */
export class SeasonalProofManifestQuery {
  region: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minPriority: number, statuses: string[], limit: number) {
    this.region = region;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalProofManifest): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalProofManifest[]): SeasonalProofManifest[] {
    const matched = collections.filter(items, (candidate: SeasonalProofManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalProofManifests(store: SeasonalProofManifestStore, query: SeasonalProofManifestQuery): SeasonalProofManifest[] {
  return query.apply(store.list());
}
