import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalFlightBundle } from "./seasonal-flight-bundle.js";

/** Keeps seasonal flight bundles by code. */
export interface SeasonalFlightBundleStore {
  find(code: string): SeasonalFlightBundle | undefined;
  save(item: SeasonalFlightBundle): void;
  remove(code: string): boolean;
  list(): SeasonalFlightBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalFlightBundleStore implements SeasonalFlightBundleStore {
  items: Map<string, SeasonalFlightBundle>;
  order: string[];

  constructor(items: Map<string, SeasonalFlightBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalFlightBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalFlightBundle): void {
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

  list(): SeasonalFlightBundle[] {
    const out: SeasonalFlightBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalFlightBundleStore(): SeasonalFlightBundleStore {
  return new MemorySeasonalFlightBundleStore(new Map<string, SeasonalFlightBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalFlightBundleStore implements SeasonalFlightBundleStore {
  inner: SeasonalFlightBundleStore;
  cache: cache.TtlCache<SeasonalFlightBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalFlightBundleStore,
    cacheValue: cache.TtlCache<SeasonalFlightBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalFlightBundle | undefined {
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

  save(item: SeasonalFlightBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalFlightBundle[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalFlightBundleStore(inner: SeasonalFlightBundleStore, ttl: number, clockValue: clock.Clock): SeasonalFlightBundleStore {
  return new CachedSeasonalFlightBundleStore(
    inner,
    cache.newTtlCache<SeasonalFlightBundle>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal flight bundles. Empty fields match all. */
export class SeasonalFlightBundleQuery {
  country: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minLimit: number, statuses: string[], limit: number) {
    this.country = country;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalFlightBundle): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalFlightBundle[]): SeasonalFlightBundle[] {
    const matched = collections.filter(items, (candidate: SeasonalFlightBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalFlightBundles(store: SeasonalFlightBundleStore, query: SeasonalFlightBundleQuery): SeasonalFlightBundle[] {
  return query.apply(store.list());
}
