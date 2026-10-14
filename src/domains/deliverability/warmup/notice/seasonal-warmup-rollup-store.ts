import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalWarmupRollup } from "./seasonal-warmup-rollup.js";

/** Keeps seasonal warmup rollups by code. */
export interface SeasonalWarmupRollupStore {
  find(code: string): SeasonalWarmupRollup | undefined;
  save(item: SeasonalWarmupRollup): void;
  remove(code: string): boolean;
  list(): SeasonalWarmupRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalWarmupRollupStore implements SeasonalWarmupRollupStore {
  items: Map<string, SeasonalWarmupRollup>;
  order: string[];

  constructor(items: Map<string, SeasonalWarmupRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalWarmupRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalWarmupRollup): void {
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

  list(): SeasonalWarmupRollup[] {
    const out: SeasonalWarmupRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalWarmupRollupStore(): SeasonalWarmupRollupStore {
  return new MemorySeasonalWarmupRollupStore(new Map<string, SeasonalWarmupRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalWarmupRollupStore implements SeasonalWarmupRollupStore {
  inner: SeasonalWarmupRollupStore;
  cache: cache.TtlCache<SeasonalWarmupRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalWarmupRollupStore,
    cacheValue: cache.TtlCache<SeasonalWarmupRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalWarmupRollup | undefined {
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

  save(item: SeasonalWarmupRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalWarmupRollup[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalWarmupRollupStore(inner: SeasonalWarmupRollupStore, ttl: number, clockValue: clock.Clock): SeasonalWarmupRollupStore {
  return new CachedSeasonalWarmupRollupStore(
    inner,
    cache.newTtlCache<SeasonalWarmupRollup>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal warmup rollups. Empty fields match all. */
export class SeasonalWarmupRollupQuery {
  name: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minVersion: number, statuses: string[], limit: number) {
    this.name = name;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalWarmupRollup): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalWarmupRollup[]): SeasonalWarmupRollup[] {
    const matched = collections.filter(items, (candidate: SeasonalWarmupRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalWarmupRollups(store: SeasonalWarmupRollupStore, query: SeasonalWarmupRollupQuery): SeasonalWarmupRollup[] {
  return query.apply(store.list());
}
