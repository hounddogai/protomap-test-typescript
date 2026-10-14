import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveConversionPreference } from "./adaptive-conversion-preference.js";

/** Keeps adaptive conversion preferences by code. */
export interface AdaptiveConversionPreferenceStore {
  find(code: string): AdaptiveConversionPreference | undefined;
  save(item: AdaptiveConversionPreference): void;
  remove(code: string): boolean;
  list(): AdaptiveConversionPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveConversionPreferenceStore implements AdaptiveConversionPreferenceStore {
  items: Map<string, AdaptiveConversionPreference>;
  order: string[];

  constructor(items: Map<string, AdaptiveConversionPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveConversionPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveConversionPreference): void {
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

  list(): AdaptiveConversionPreference[] {
    const out: AdaptiveConversionPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveConversionPreferenceStore(): AdaptiveConversionPreferenceStore {
  return new MemoryAdaptiveConversionPreferenceStore(new Map<string, AdaptiveConversionPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveConversionPreferenceStore implements AdaptiveConversionPreferenceStore {
  inner: AdaptiveConversionPreferenceStore;
  cache: cache.TtlCache<AdaptiveConversionPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveConversionPreferenceStore,
    cacheValue: cache.TtlCache<AdaptiveConversionPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveConversionPreference | undefined {
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

  save(item: AdaptiveConversionPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveConversionPreference[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveConversionPreferenceStore(inner: AdaptiveConversionPreferenceStore, ttl: number, clockValue: clock.Clock): AdaptiveConversionPreferenceStore {
  return new CachedAdaptiveConversionPreferenceStore(
    inner,
    cache.newTtlCache<AdaptiveConversionPreference>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive conversion preferences. Empty fields match all. */
export class AdaptiveConversionPreferenceQuery {
  locale: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBatchSize: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveConversionPreference): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveConversionPreference[]): AdaptiveConversionPreference[] {
    const matched = collections.filter(items, (candidate: AdaptiveConversionPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveConversionPreferences(store: AdaptiveConversionPreferenceStore, query: AdaptiveConversionPreferenceQuery): AdaptiveConversionPreference[] {
  return query.apply(store.list());
}
