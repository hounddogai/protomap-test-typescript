import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictWindowPreference } from "./strict-window-preference.js";

/** Keeps strict window preferences by code. */
export interface StrictWindowPreferenceStore {
  find(code: string): StrictWindowPreference | undefined;
  save(item: StrictWindowPreference): void;
  remove(code: string): boolean;
  list(): StrictWindowPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictWindowPreferenceStore implements StrictWindowPreferenceStore {
  items: Map<string, StrictWindowPreference>;
  order: string[];

  constructor(items: Map<string, StrictWindowPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictWindowPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictWindowPreference): void {
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

  list(): StrictWindowPreference[] {
    const out: StrictWindowPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictWindowPreferenceStore(): StrictWindowPreferenceStore {
  return new MemoryStrictWindowPreferenceStore(new Map<string, StrictWindowPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictWindowPreferenceStore implements StrictWindowPreferenceStore {
  inner: StrictWindowPreferenceStore;
  cache: cache.TtlCache<StrictWindowPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictWindowPreferenceStore,
    cacheValue: cache.TtlCache<StrictWindowPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictWindowPreference | undefined {
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

  save(item: StrictWindowPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictWindowPreference[] {
    return this.inner.list();
  }
}

export function newCachedStrictWindowPreferenceStore(inner: StrictWindowPreferenceStore, ttl: number, clockValue: clock.Clock): StrictWindowPreferenceStore {
  return new CachedStrictWindowPreferenceStore(
    inner,
    cache.newTtlCache<StrictWindowPreference>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict window preferences. Empty fields match all. */
export class StrictWindowPreferenceQuery {
  title: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minConversionRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictWindowPreference): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictWindowPreference[]): StrictWindowPreference[] {
    const matched = collections.filter(items, (candidate: StrictWindowPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictWindowPreferences(store: StrictWindowPreferenceStore, query: StrictWindowPreferenceQuery): StrictWindowPreference[] {
  return query.apply(store.list());
}
