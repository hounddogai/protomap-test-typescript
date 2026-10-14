import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatMapping } from "./csat-mapping.js";

/** Keeps csat mappings by code. */
export interface CsatMappingStore {
  find(code: string): CsatMapping | undefined;
  save(item: CsatMapping): void;
  remove(code: string): boolean;
  list(): CsatMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatMappingStore implements CsatMappingStore {
  items: Map<string, CsatMapping>;
  order: string[];

  constructor(items: Map<string, CsatMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatMapping): void {
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

  list(): CsatMapping[] {
    const out: CsatMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatMappingStore(): CsatMappingStore {
  return new MemoryCsatMappingStore(new Map<string, CsatMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatMappingStore implements CsatMappingStore {
  inner: CsatMappingStore;
  cache: cache.TtlCache<CsatMapping>;
  hits: number;
  misses: number;

  constructor(inner: CsatMappingStore, cacheValue: cache.TtlCache<CsatMapping>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatMapping | undefined {
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

  save(item: CsatMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatMapping[] {
    return this.inner.list();
  }
}

export function newCachedCsatMappingStore(inner: CsatMappingStore, ttl: number, clockValue: clock.Clock): CsatMappingStore {
  return new CachedCsatMappingStore(inner, cache.newTtlCache<CsatMapping>(512, ttl, clockValue), 0, 0);
}

/** Selects csat mappings. Empty fields match all. */
export class CsatMappingQuery {
  locale: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBid: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatMapping): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatMapping[]): CsatMapping[] {
    const matched = collections.filter(items, (candidate: CsatMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatMappings(store: CsatMappingStore, query: CsatMappingQuery): CsatMapping[] {
  return query.apply(store.list());
}
