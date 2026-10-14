import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalPostOverride } from "./seasonal-post-override.js";

/** Keeps seasonal post overrides by code. */
export interface SeasonalPostOverrideStore {
  find(code: string): SeasonalPostOverride | undefined;
  save(item: SeasonalPostOverride): void;
  remove(code: string): boolean;
  list(): SeasonalPostOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalPostOverrideStore implements SeasonalPostOverrideStore {
  items: Map<string, SeasonalPostOverride>;
  order: string[];

  constructor(items: Map<string, SeasonalPostOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalPostOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalPostOverride): void {
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

  list(): SeasonalPostOverride[] {
    const out: SeasonalPostOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalPostOverrideStore(): SeasonalPostOverrideStore {
  return new MemorySeasonalPostOverrideStore(new Map<string, SeasonalPostOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalPostOverrideStore implements SeasonalPostOverrideStore {
  inner: SeasonalPostOverrideStore;
  cache: cache.TtlCache<SeasonalPostOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalPostOverrideStore,
    cacheValue: cache.TtlCache<SeasonalPostOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalPostOverride | undefined {
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

  save(item: SeasonalPostOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalPostOverride[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalPostOverrideStore(inner: SeasonalPostOverrideStore, ttl: number, clockValue: clock.Clock): SeasonalPostOverrideStore {
  return new CachedSeasonalPostOverrideStore(
    inner,
    cache.newTtlCache<SeasonalPostOverride>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal post overrides. Empty fields match all. */
export class SeasonalPostOverrideQuery {
  region: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minConversionRate: number, statuses: string[], limit: number) {
    this.region = region;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalPostOverride): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalPostOverride[]): SeasonalPostOverride[] {
    const matched = collections.filter(items, (candidate: SeasonalPostOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalPostOverrides(store: SeasonalPostOverrideStore, query: SeasonalPostOverrideQuery): SeasonalPostOverride[] {
  return query.apply(store.list());
}
