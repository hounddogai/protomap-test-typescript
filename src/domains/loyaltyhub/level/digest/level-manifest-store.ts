import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LevelManifest } from "./level-manifest.js";

/** Keeps level manifests by code. */
export interface LevelManifestStore {
  find(code: string): LevelManifest | undefined;
  save(item: LevelManifest): void;
  remove(code: string): boolean;
  list(): LevelManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLevelManifestStore implements LevelManifestStore {
  items: Map<string, LevelManifest>;
  order: string[];

  constructor(items: Map<string, LevelManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LevelManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LevelManifest): void {
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

  list(): LevelManifest[] {
    const out: LevelManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLevelManifestStore(): LevelManifestStore {
  return new MemoryLevelManifestStore(new Map<string, LevelManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLevelManifestStore implements LevelManifestStore {
  inner: LevelManifestStore;
  cache: cache.TtlCache<LevelManifest>;
  hits: number;
  misses: number;

  constructor(inner: LevelManifestStore, cacheValue: cache.TtlCache<LevelManifest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LevelManifest | undefined {
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

  save(item: LevelManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LevelManifest[] {
    return this.inner.list();
  }
}

export function newCachedLevelManifestStore(inner: LevelManifestStore, ttl: number, clockValue: clock.Clock): LevelManifestStore {
  return new CachedLevelManifestStore(inner, cache.newTtlCache<LevelManifest>(512, ttl, clockValue), 0, 0);
}

/** Selects level manifests. Empty fields match all. */
export class LevelManifestQuery {
  region: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minAmount: number, statuses: string[], limit: number) {
    this.region = region;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LevelManifest): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LevelManifest[]): LevelManifest[] {
    const matched = collections.filter(items, (candidate: LevelManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLevelManifests(store: LevelManifestStore, query: LevelManifestQuery): LevelManifest[] {
  return query.apply(store.list());
}
