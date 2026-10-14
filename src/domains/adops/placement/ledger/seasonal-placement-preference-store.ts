import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalPlacementPreference } from "./seasonal-placement-preference.js";

/** Keeps seasonal placement preferences by code. */
export interface SeasonalPlacementPreferenceStore {
  find(code: string): SeasonalPlacementPreference | undefined;
  save(item: SeasonalPlacementPreference): void;
  remove(code: string): boolean;
  list(): SeasonalPlacementPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalPlacementPreferenceStore implements SeasonalPlacementPreferenceStore {
  items: Map<string, SeasonalPlacementPreference>;
  order: string[];

  constructor(items: Map<string, SeasonalPlacementPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalPlacementPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalPlacementPreference): void {
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

  list(): SeasonalPlacementPreference[] {
    const out: SeasonalPlacementPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalPlacementPreferenceStore(): SeasonalPlacementPreferenceStore {
  return new MemorySeasonalPlacementPreferenceStore(new Map<string, SeasonalPlacementPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalPlacementPreferenceStore implements SeasonalPlacementPreferenceStore {
  inner: SeasonalPlacementPreferenceStore;
  cache: cache.TtlCache<SeasonalPlacementPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalPlacementPreferenceStore,
    cacheValue: cache.TtlCache<SeasonalPlacementPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalPlacementPreference | undefined {
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

  save(item: SeasonalPlacementPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalPlacementPreference[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalPlacementPreferenceStore(inner: SeasonalPlacementPreferenceStore, ttl: number, clockValue: clock.Clock): SeasonalPlacementPreferenceStore {
  return new CachedSeasonalPlacementPreferenceStore(
    inner,
    cache.newTtlCache<SeasonalPlacementPreference>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal placement preferences. Empty fields match all. */
export class SeasonalPlacementPreferenceQuery {
  title: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalPlacementPreference): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalPlacementPreference[]): SeasonalPlacementPreference[] {
    const matched = collections.filter(items, (candidate: SeasonalPlacementPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalPlacementPreferences(store: SeasonalPlacementPreferenceStore, query: SeasonalPlacementPreferenceQuery): SeasonalPlacementPreference[] {
  return query.apply(store.list());
}
