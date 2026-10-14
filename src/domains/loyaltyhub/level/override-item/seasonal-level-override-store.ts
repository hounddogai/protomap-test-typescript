import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalLevelOverride } from "./seasonal-level-override.js";

/** Keeps seasonal level overrides by code. */
export interface SeasonalLevelOverrideStore {
  find(code: string): SeasonalLevelOverride | undefined;
  save(item: SeasonalLevelOverride): void;
  remove(code: string): boolean;
  list(): SeasonalLevelOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalLevelOverrideStore implements SeasonalLevelOverrideStore {
  items: Map<string, SeasonalLevelOverride>;
  order: string[];

  constructor(items: Map<string, SeasonalLevelOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalLevelOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalLevelOverride): void {
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

  list(): SeasonalLevelOverride[] {
    const out: SeasonalLevelOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalLevelOverrideStore(): SeasonalLevelOverrideStore {
  return new MemorySeasonalLevelOverrideStore(new Map<string, SeasonalLevelOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalLevelOverrideStore implements SeasonalLevelOverrideStore {
  inner: SeasonalLevelOverrideStore;
  cache: cache.TtlCache<SeasonalLevelOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalLevelOverrideStore,
    cacheValue: cache.TtlCache<SeasonalLevelOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalLevelOverride | undefined {
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

  save(item: SeasonalLevelOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalLevelOverride[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalLevelOverrideStore(inner: SeasonalLevelOverrideStore, ttl: number, clockValue: clock.Clock): SeasonalLevelOverrideStore {
  return new CachedSeasonalLevelOverrideStore(
    inner,
    cache.newTtlCache<SeasonalLevelOverride>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal level overrides. Empty fields match all. */
export class SeasonalLevelOverrideQuery {
  region: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minRate: number, statuses: string[], limit: number) {
    this.region = region;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalLevelOverride): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalLevelOverride[]): SeasonalLevelOverride[] {
    const matched = collections.filter(items, (candidate: SeasonalLevelOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalLevelOverrides(store: SeasonalLevelOverrideStore, query: SeasonalLevelOverrideQuery): SeasonalLevelOverride[] {
  return query.apply(store.list());
}
