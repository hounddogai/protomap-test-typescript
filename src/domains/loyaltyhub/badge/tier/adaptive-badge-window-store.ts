import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveBadgeWindow } from "./adaptive-badge-window.js";

/** Keeps adaptive badge windows by code. */
export interface AdaptiveBadgeWindowStore {
  find(code: string): AdaptiveBadgeWindow | undefined;
  save(item: AdaptiveBadgeWindow): void;
  remove(code: string): boolean;
  list(): AdaptiveBadgeWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveBadgeWindowStore implements AdaptiveBadgeWindowStore {
  items: Map<string, AdaptiveBadgeWindow>;
  order: string[];

  constructor(items: Map<string, AdaptiveBadgeWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveBadgeWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveBadgeWindow): void {
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

  list(): AdaptiveBadgeWindow[] {
    const out: AdaptiveBadgeWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveBadgeWindowStore(): AdaptiveBadgeWindowStore {
  return new MemoryAdaptiveBadgeWindowStore(new Map<string, AdaptiveBadgeWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveBadgeWindowStore implements AdaptiveBadgeWindowStore {
  inner: AdaptiveBadgeWindowStore;
  cache: cache.TtlCache<AdaptiveBadgeWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveBadgeWindowStore,
    cacheValue: cache.TtlCache<AdaptiveBadgeWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveBadgeWindow | undefined {
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

  save(item: AdaptiveBadgeWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveBadgeWindow[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveBadgeWindowStore(inner: AdaptiveBadgeWindowStore, ttl: number, clockValue: clock.Clock): AdaptiveBadgeWindowStore {
  return new CachedAdaptiveBadgeWindowStore(inner, cache.newTtlCache<AdaptiveBadgeWindow>(64, ttl, clockValue), 0, 0);
}

/** Selects adaptive badge windows. Empty fields match all. */
export class AdaptiveBadgeWindowQuery {
  locale: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCapacity: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveBadgeWindow): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveBadgeWindow[]): AdaptiveBadgeWindow[] {
    const matched = collections.filter(items, (candidate: AdaptiveBadgeWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveBadgeWindows(store: AdaptiveBadgeWindowStore, query: AdaptiveBadgeWindowQuery): AdaptiveBadgeWindow[] {
  return query.apply(store.list());
}
