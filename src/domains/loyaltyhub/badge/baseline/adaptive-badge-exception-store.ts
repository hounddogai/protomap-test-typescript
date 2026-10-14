import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveBadgeException } from "./adaptive-badge-exception.js";

/** Keeps adaptive badge exceptions by code. */
export interface AdaptiveBadgeExceptionStore {
  find(code: string): AdaptiveBadgeException | undefined;
  save(item: AdaptiveBadgeException): void;
  remove(code: string): boolean;
  list(): AdaptiveBadgeException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveBadgeExceptionStore implements AdaptiveBadgeExceptionStore {
  items: Map<string, AdaptiveBadgeException>;
  order: string[];

  constructor(items: Map<string, AdaptiveBadgeException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveBadgeException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveBadgeException): void {
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

  list(): AdaptiveBadgeException[] {
    const out: AdaptiveBadgeException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveBadgeExceptionStore(): AdaptiveBadgeExceptionStore {
  return new MemoryAdaptiveBadgeExceptionStore(new Map<string, AdaptiveBadgeException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveBadgeExceptionStore implements AdaptiveBadgeExceptionStore {
  inner: AdaptiveBadgeExceptionStore;
  cache: cache.TtlCache<AdaptiveBadgeException>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveBadgeExceptionStore,
    cacheValue: cache.TtlCache<AdaptiveBadgeException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveBadgeException | undefined {
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

  save(item: AdaptiveBadgeException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveBadgeException[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveBadgeExceptionStore(inner: AdaptiveBadgeExceptionStore, ttl: number, clockValue: clock.Clock): AdaptiveBadgeExceptionStore {
  return new CachedAdaptiveBadgeExceptionStore(
    inner,
    cache.newTtlCache<AdaptiveBadgeException>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive badge exceptions. Empty fields match all. */
export class AdaptiveBadgeExceptionQuery {
  utmSource: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minFloorValue: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveBadgeException): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveBadgeException[]): AdaptiveBadgeException[] {
    const matched = collections.filter(items, (candidate: AdaptiveBadgeException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveBadgeExceptions(store: AdaptiveBadgeExceptionStore, query: AdaptiveBadgeExceptionQuery): AdaptiveBadgeException[] {
  return query.apply(store.list());
}
