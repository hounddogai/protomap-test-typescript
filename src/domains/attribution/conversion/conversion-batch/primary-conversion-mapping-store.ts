import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryConversionMapping } from "./primary-conversion-mapping.js";

/** Keeps primary conversion mappings by code. */
export interface PrimaryConversionMappingStore {
  find(code: string): PrimaryConversionMapping | undefined;
  save(item: PrimaryConversionMapping): void;
  remove(code: string): boolean;
  list(): PrimaryConversionMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryConversionMappingStore implements PrimaryConversionMappingStore {
  items: Map<string, PrimaryConversionMapping>;
  order: string[];

  constructor(items: Map<string, PrimaryConversionMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryConversionMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryConversionMapping): void {
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

  list(): PrimaryConversionMapping[] {
    const out: PrimaryConversionMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryConversionMappingStore(): PrimaryConversionMappingStore {
  return new MemoryPrimaryConversionMappingStore(new Map<string, PrimaryConversionMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryConversionMappingStore implements PrimaryConversionMappingStore {
  inner: PrimaryConversionMappingStore;
  cache: cache.TtlCache<PrimaryConversionMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryConversionMappingStore,
    cacheValue: cache.TtlCache<PrimaryConversionMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryConversionMapping | undefined {
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

  save(item: PrimaryConversionMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryConversionMapping[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryConversionMappingStore(inner: PrimaryConversionMappingStore, ttl: number, clockValue: clock.Clock): PrimaryConversionMappingStore {
  return new CachedPrimaryConversionMappingStore(
    inner,
    cache.newTtlCache<PrimaryConversionMapping>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary conversion mappings. Empty fields match all. */
export class PrimaryConversionMappingQuery {
  locale: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minWindowDays: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryConversionMapping): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryConversionMapping[]): PrimaryConversionMapping[] {
    const matched = collections.filter(items, (candidate: PrimaryConversionMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryConversionMappings(store: PrimaryConversionMappingStore, query: PrimaryConversionMappingQuery): PrimaryConversionMapping[] {
  return query.apply(store.list());
}
