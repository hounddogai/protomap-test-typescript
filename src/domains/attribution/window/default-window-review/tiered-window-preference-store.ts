import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredWindowPreference } from "./tiered-window-preference.js";

/** Keeps tiered window preferences by code. */
export interface TieredWindowPreferenceStore {
  find(code: string): TieredWindowPreference | undefined;
  save(item: TieredWindowPreference): void;
  remove(code: string): boolean;
  list(): TieredWindowPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredWindowPreferenceStore implements TieredWindowPreferenceStore {
  items: Map<string, TieredWindowPreference>;
  order: string[];

  constructor(items: Map<string, TieredWindowPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredWindowPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredWindowPreference): void {
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

  list(): TieredWindowPreference[] {
    const out: TieredWindowPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredWindowPreferenceStore(): TieredWindowPreferenceStore {
  return new MemoryTieredWindowPreferenceStore(new Map<string, TieredWindowPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredWindowPreferenceStore implements TieredWindowPreferenceStore {
  inner: TieredWindowPreferenceStore;
  cache: cache.TtlCache<TieredWindowPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredWindowPreferenceStore,
    cacheValue: cache.TtlCache<TieredWindowPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredWindowPreference | undefined {
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

  save(item: TieredWindowPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredWindowPreference[] {
    return this.inner.list();
  }
}

export function newCachedTieredWindowPreferenceStore(inner: TieredWindowPreferenceStore, ttl: number, clockValue: clock.Clock): TieredWindowPreferenceStore {
  return new CachedTieredWindowPreferenceStore(
    inner,
    cache.newTtlCache<TieredWindowPreference>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered window preferences. Empty fields match all. */
export class TieredWindowPreferenceQuery {
  label: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minLimit: number, statuses: string[], limit: number) {
    this.label = label;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredWindowPreference): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredWindowPreference[]): TieredWindowPreference[] {
    const matched = collections.filter(items, (candidate: TieredWindowPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredWindowPreferences(store: TieredWindowPreferenceStore, query: TieredWindowPreferenceQuery): TieredWindowPreference[] {
  return query.apply(store.list());
}
