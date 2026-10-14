import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedBouncePreference } from "./weighted-bounce-preference.js";

/** Keeps weighted bounce preferences by code. */
export interface WeightedBouncePreferenceStore {
  find(code: string): WeightedBouncePreference | undefined;
  save(item: WeightedBouncePreference): void;
  remove(code: string): boolean;
  list(): WeightedBouncePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedBouncePreferenceStore implements WeightedBouncePreferenceStore {
  items: Map<string, WeightedBouncePreference>;
  order: string[];

  constructor(items: Map<string, WeightedBouncePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedBouncePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedBouncePreference): void {
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

  list(): WeightedBouncePreference[] {
    const out: WeightedBouncePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedBouncePreferenceStore(): WeightedBouncePreferenceStore {
  return new MemoryWeightedBouncePreferenceStore(new Map<string, WeightedBouncePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedBouncePreferenceStore implements WeightedBouncePreferenceStore {
  inner: WeightedBouncePreferenceStore;
  cache: cache.TtlCache<WeightedBouncePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedBouncePreferenceStore,
    cacheValue: cache.TtlCache<WeightedBouncePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedBouncePreference | undefined {
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

  save(item: WeightedBouncePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedBouncePreference[] {
    return this.inner.list();
  }
}

export function newCachedWeightedBouncePreferenceStore(inner: WeightedBouncePreferenceStore, ttl: number, clockValue: clock.Clock): WeightedBouncePreferenceStore {
  return new CachedWeightedBouncePreferenceStore(
    inner,
    cache.newTtlCache<WeightedBouncePreference>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted bounce preferences. Empty fields match all. */
export class WeightedBouncePreferenceQuery {
  category: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRatio: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedBouncePreference): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedBouncePreference[]): WeightedBouncePreference[] {
    const matched = collections.filter(items, (candidate: WeightedBouncePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedBouncePreferences(store: WeightedBouncePreferenceStore, query: WeightedBouncePreferenceQuery): WeightedBouncePreference[] {
  return query.apply(store.list());
}
