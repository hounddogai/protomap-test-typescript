import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalBouncePreference } from "./seasonal-bounce-preference.js";

/** Keeps seasonal bounce preferences by code. */
export interface SeasonalBouncePreferenceStore {
  find(code: string): SeasonalBouncePreference | undefined;
  save(item: SeasonalBouncePreference): void;
  remove(code: string): boolean;
  list(): SeasonalBouncePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalBouncePreferenceStore implements SeasonalBouncePreferenceStore {
  items: Map<string, SeasonalBouncePreference>;
  order: string[];

  constructor(items: Map<string, SeasonalBouncePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalBouncePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalBouncePreference): void {
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

  list(): SeasonalBouncePreference[] {
    const out: SeasonalBouncePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalBouncePreferenceStore(): SeasonalBouncePreferenceStore {
  return new MemorySeasonalBouncePreferenceStore(new Map<string, SeasonalBouncePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalBouncePreferenceStore implements SeasonalBouncePreferenceStore {
  inner: SeasonalBouncePreferenceStore;
  cache: cache.TtlCache<SeasonalBouncePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalBouncePreferenceStore,
    cacheValue: cache.TtlCache<SeasonalBouncePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalBouncePreference | undefined {
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

  save(item: SeasonalBouncePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalBouncePreference[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalBouncePreferenceStore(inner: SeasonalBouncePreferenceStore, ttl: number, clockValue: clock.Clock): SeasonalBouncePreferenceStore {
  return new CachedSeasonalBouncePreferenceStore(
    inner,
    cache.newTtlCache<SeasonalBouncePreference>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal bounce preferences. Empty fields match all. */
export class SeasonalBouncePreferenceQuery {
  source: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minLimit: number, statuses: string[], limit: number) {
    this.source = source;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalBouncePreference): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalBouncePreference[]): SeasonalBouncePreference[] {
    const matched = collections.filter(items, (candidate: SeasonalBouncePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalBouncePreferences(store: SeasonalBouncePreferenceStore, query: SeasonalBouncePreferenceQuery): SeasonalBouncePreference[] {
  return query.apply(store.list());
}
