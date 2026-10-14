import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveConversionWindow } from "./adaptive-conversion-window.js";

/** Keeps adaptive conversion windows by code. */
export interface AdaptiveConversionWindowStore {
  find(code: string): AdaptiveConversionWindow | undefined;
  save(item: AdaptiveConversionWindow): void;
  remove(code: string): boolean;
  list(): AdaptiveConversionWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveConversionWindowStore implements AdaptiveConversionWindowStore {
  items: Map<string, AdaptiveConversionWindow>;
  order: string[];

  constructor(items: Map<string, AdaptiveConversionWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveConversionWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveConversionWindow): void {
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

  list(): AdaptiveConversionWindow[] {
    const out: AdaptiveConversionWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveConversionWindowStore(): AdaptiveConversionWindowStore {
  return new MemoryAdaptiveConversionWindowStore(new Map<string, AdaptiveConversionWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveConversionWindowStore implements AdaptiveConversionWindowStore {
  inner: AdaptiveConversionWindowStore;
  cache: cache.TtlCache<AdaptiveConversionWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveConversionWindowStore,
    cacheValue: cache.TtlCache<AdaptiveConversionWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveConversionWindow | undefined {
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

  save(item: AdaptiveConversionWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveConversionWindow[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveConversionWindowStore(inner: AdaptiveConversionWindowStore, ttl: number, clockValue: clock.Clock): AdaptiveConversionWindowStore {
  return new CachedAdaptiveConversionWindowStore(
    inner,
    cache.newTtlCache<AdaptiveConversionWindow>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive conversion windows. Empty fields match all. */
export class AdaptiveConversionWindowQuery {
  locale: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minScore: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveConversionWindow): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveConversionWindow[]): AdaptiveConversionWindow[] {
    const matched = collections.filter(items, (candidate: AdaptiveConversionWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveConversionWindows(store: AdaptiveConversionWindowStore, query: AdaptiveConversionWindowQuery): AdaptiveConversionWindow[] {
  return query.apply(store.list());
}
