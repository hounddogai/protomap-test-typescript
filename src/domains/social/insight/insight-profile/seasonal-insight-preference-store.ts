import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalInsightPreference } from "./seasonal-insight-preference.js";

/** Keeps seasonal insight preferences by code. */
export interface SeasonalInsightPreferenceStore {
  find(code: string): SeasonalInsightPreference | undefined;
  save(item: SeasonalInsightPreference): void;
  remove(code: string): boolean;
  list(): SeasonalInsightPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalInsightPreferenceStore implements SeasonalInsightPreferenceStore {
  items: Map<string, SeasonalInsightPreference>;
  order: string[];

  constructor(items: Map<string, SeasonalInsightPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalInsightPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalInsightPreference): void {
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

  list(): SeasonalInsightPreference[] {
    const out: SeasonalInsightPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalInsightPreferenceStore(): SeasonalInsightPreferenceStore {
  return new MemorySeasonalInsightPreferenceStore(new Map<string, SeasonalInsightPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalInsightPreferenceStore implements SeasonalInsightPreferenceStore {
  inner: SeasonalInsightPreferenceStore;
  cache: cache.TtlCache<SeasonalInsightPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalInsightPreferenceStore,
    cacheValue: cache.TtlCache<SeasonalInsightPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalInsightPreference | undefined {
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

  save(item: SeasonalInsightPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalInsightPreference[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalInsightPreferenceStore(inner: SeasonalInsightPreferenceStore, ttl: number, clockValue: clock.Clock): SeasonalInsightPreferenceStore {
  return new CachedSeasonalInsightPreferenceStore(
    inner,
    cache.newTtlCache<SeasonalInsightPreference>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal insight preferences. Empty fields match all. */
export class SeasonalInsightPreferenceQuery {
  category: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minVersion: number, statuses: string[], limit: number) {
    this.category = category;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalInsightPreference): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalInsightPreference[]): SeasonalInsightPreference[] {
    const matched = collections.filter(items, (candidate: SeasonalInsightPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalInsightPreferences(store: SeasonalInsightPreferenceStore, query: SeasonalInsightPreferenceQuery): SeasonalInsightPreference[] {
  return query.apply(store.list());
}
