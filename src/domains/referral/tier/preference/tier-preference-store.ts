import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TierPreference } from "./tier-preference.js";

/** Keeps tier preferences by code. */
export interface TierPreferenceStore {
  find(code: string): TierPreference | undefined;
  save(item: TierPreference): void;
  remove(code: string): boolean;
  list(): TierPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTierPreferenceStore implements TierPreferenceStore {
  items: Map<string, TierPreference>;
  order: string[];

  constructor(items: Map<string, TierPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TierPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TierPreference): void {
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

  list(): TierPreference[] {
    const out: TierPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTierPreferenceStore(): TierPreferenceStore {
  return new MemoryTierPreferenceStore(new Map<string, TierPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTierPreferenceStore implements TierPreferenceStore {
  inner: TierPreferenceStore;
  cache: cache.TtlCache<TierPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: TierPreferenceStore,
    cacheValue: cache.TtlCache<TierPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TierPreference | undefined {
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

  save(item: TierPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TierPreference[] {
    return this.inner.list();
  }
}

export function newCachedTierPreferenceStore(inner: TierPreferenceStore, ttl: number, clockValue: clock.Clock): TierPreferenceStore {
  return new CachedTierPreferenceStore(inner, cache.newTtlCache<TierPreference>(64, ttl, clockValue), 0, 0);
}

/** Selects tier preferences. Empty fields match all. */
export class TierPreferenceQuery {
  name: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minWeight: number, statuses: string[], limit: number) {
    this.name = name;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TierPreference): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TierPreference[]): TierPreference[] {
    const matched = collections.filter(items, (candidate: TierPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTierPreferences(store: TierPreferenceStore, query: TierPreferenceQuery): TierPreference[] {
  return query.apply(store.list());
}
