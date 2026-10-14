import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LevelBundle } from "./level-bundle.js";

/** Keeps level bundles by code. */
export interface LevelBundleStore {
  find(code: string): LevelBundle | undefined;
  save(item: LevelBundle): void;
  remove(code: string): boolean;
  list(): LevelBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLevelBundleStore implements LevelBundleStore {
  items: Map<string, LevelBundle>;
  order: string[];

  constructor(items: Map<string, LevelBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LevelBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LevelBundle): void {
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

  list(): LevelBundle[] {
    const out: LevelBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLevelBundleStore(): LevelBundleStore {
  return new MemoryLevelBundleStore(new Map<string, LevelBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLevelBundleStore implements LevelBundleStore {
  inner: LevelBundleStore;
  cache: cache.TtlCache<LevelBundle>;
  hits: number;
  misses: number;

  constructor(inner: LevelBundleStore, cacheValue: cache.TtlCache<LevelBundle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LevelBundle | undefined {
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

  save(item: LevelBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LevelBundle[] {
    return this.inner.list();
  }
}

export function newCachedLevelBundleStore(inner: LevelBundleStore, ttl: number, clockValue: clock.Clock): LevelBundleStore {
  return new CachedLevelBundleStore(inner, cache.newTtlCache<LevelBundle>(1024, ttl, clockValue), 0, 0);
}

/** Selects level bundles. Empty fields match all. */
export class LevelBundleQuery {
  unit: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minRate: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LevelBundle): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LevelBundle[]): LevelBundle[] {
    const matched = collections.filter(items, (candidate: LevelBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLevelBundles(store: LevelBundleStore, query: LevelBundleQuery): LevelBundle[] {
  return query.apply(store.list());
}
