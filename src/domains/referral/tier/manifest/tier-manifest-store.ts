import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TierManifest } from "./tier-manifest.js";

/** Keeps tier manifests by code. */
export interface TierManifestStore {
  find(code: string): TierManifest | undefined;
  save(item: TierManifest): void;
  remove(code: string): boolean;
  list(): TierManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTierManifestStore implements TierManifestStore {
  items: Map<string, TierManifest>;
  order: string[];

  constructor(items: Map<string, TierManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TierManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TierManifest): void {
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

  list(): TierManifest[] {
    const out: TierManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTierManifestStore(): TierManifestStore {
  return new MemoryTierManifestStore(new Map<string, TierManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTierManifestStore implements TierManifestStore {
  inner: TierManifestStore;
  cache: cache.TtlCache<TierManifest>;
  hits: number;
  misses: number;

  constructor(inner: TierManifestStore, cacheValue: cache.TtlCache<TierManifest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TierManifest | undefined {
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

  save(item: TierManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TierManifest[] {
    return this.inner.list();
  }
}

export function newCachedTierManifestStore(inner: TierManifestStore, ttl: number, clockValue: clock.Clock): TierManifestStore {
  return new CachedTierManifestStore(inner, cache.newTtlCache<TierManifest>(512, ttl, clockValue), 0, 0);
}

/** Selects tier manifests. Empty fields match all. */
export class TierManifestQuery {
  channel: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TierManifest): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TierManifest[]): TierManifest[] {
    const matched = collections.filter(items, (candidate: TierManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTierManifests(store: TierManifestStore, query: TierManifestQuery): TierManifest[] {
  return query.apply(store.list());
}
