import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredLevelPreference } from "./tiered-level-preference.js";

/** Keeps tiered level preferences by code. */
export interface TieredLevelPreferenceStore {
  find(code: string): TieredLevelPreference | undefined;
  save(item: TieredLevelPreference): void;
  remove(code: string): boolean;
  list(): TieredLevelPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredLevelPreferenceStore implements TieredLevelPreferenceStore {
  items: Map<string, TieredLevelPreference>;
  order: string[];

  constructor(items: Map<string, TieredLevelPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredLevelPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredLevelPreference): void {
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

  list(): TieredLevelPreference[] {
    const out: TieredLevelPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredLevelPreferenceStore(): TieredLevelPreferenceStore {
  return new MemoryTieredLevelPreferenceStore(new Map<string, TieredLevelPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredLevelPreferenceStore implements TieredLevelPreferenceStore {
  inner: TieredLevelPreferenceStore;
  cache: cache.TtlCache<TieredLevelPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredLevelPreferenceStore,
    cacheValue: cache.TtlCache<TieredLevelPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredLevelPreference | undefined {
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

  save(item: TieredLevelPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredLevelPreference[] {
    return this.inner.list();
  }
}

export function newCachedTieredLevelPreferenceStore(inner: TieredLevelPreferenceStore, ttl: number, clockValue: clock.Clock): TieredLevelPreferenceStore {
  return new CachedTieredLevelPreferenceStore(
    inner,
    cache.newTtlCache<TieredLevelPreference>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered level preferences. Empty fields match all. */
export class TieredLevelPreferenceQuery {
  category: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minBudget: number, statuses: string[], limit: number) {
    this.category = category;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredLevelPreference): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredLevelPreference[]): TieredLevelPreference[] {
    const matched = collections.filter(items, (candidate: TieredLevelPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredLevelPreferences(store: TieredLevelPreferenceStore, query: TieredLevelPreferenceQuery): TieredLevelPreference[] {
  return query.apply(store.list());
}
