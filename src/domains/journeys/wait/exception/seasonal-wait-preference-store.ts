import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalWaitPreference } from "./seasonal-wait-preference.js";

/** Keeps seasonal wait preferences by code. */
export interface SeasonalWaitPreferenceStore {
  find(code: string): SeasonalWaitPreference | undefined;
  save(item: SeasonalWaitPreference): void;
  remove(code: string): boolean;
  list(): SeasonalWaitPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalWaitPreferenceStore implements SeasonalWaitPreferenceStore {
  items: Map<string, SeasonalWaitPreference>;
  order: string[];

  constructor(items: Map<string, SeasonalWaitPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalWaitPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalWaitPreference): void {
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

  list(): SeasonalWaitPreference[] {
    const out: SeasonalWaitPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalWaitPreferenceStore(): SeasonalWaitPreferenceStore {
  return new MemorySeasonalWaitPreferenceStore(new Map<string, SeasonalWaitPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalWaitPreferenceStore implements SeasonalWaitPreferenceStore {
  inner: SeasonalWaitPreferenceStore;
  cache: cache.TtlCache<SeasonalWaitPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalWaitPreferenceStore,
    cacheValue: cache.TtlCache<SeasonalWaitPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalWaitPreference | undefined {
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

  save(item: SeasonalWaitPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalWaitPreference[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalWaitPreferenceStore(inner: SeasonalWaitPreferenceStore, ttl: number, clockValue: clock.Clock): SeasonalWaitPreferenceStore {
  return new CachedSeasonalWaitPreferenceStore(
    inner,
    cache.newTtlCache<SeasonalWaitPreference>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal wait preferences. Empty fields match all. */
export class SeasonalWaitPreferenceQuery {
  label: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBid: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalWaitPreference): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalWaitPreference[]): SeasonalWaitPreference[] {
    const matched = collections.filter(items, (candidate: SeasonalWaitPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalWaitPreferences(store: SeasonalWaitPreferenceStore, query: SeasonalWaitPreferenceQuery): SeasonalWaitPreference[] {
  return query.apply(store.list());
}
