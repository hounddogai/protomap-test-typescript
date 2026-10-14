import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimarySlaMapping } from "./primary-sla-mapping.js";

/** Keeps primary sla mappings by code. */
export interface PrimarySlaMappingStore {
  find(code: string): PrimarySlaMapping | undefined;
  save(item: PrimarySlaMapping): void;
  remove(code: string): boolean;
  list(): PrimarySlaMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimarySlaMappingStore implements PrimarySlaMappingStore {
  items: Map<string, PrimarySlaMapping>;
  order: string[];

  constructor(items: Map<string, PrimarySlaMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimarySlaMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimarySlaMapping): void {
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

  list(): PrimarySlaMapping[] {
    const out: PrimarySlaMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimarySlaMappingStore(): PrimarySlaMappingStore {
  return new MemoryPrimarySlaMappingStore(new Map<string, PrimarySlaMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimarySlaMappingStore implements PrimarySlaMappingStore {
  inner: PrimarySlaMappingStore;
  cache: cache.TtlCache<PrimarySlaMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimarySlaMappingStore,
    cacheValue: cache.TtlCache<PrimarySlaMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimarySlaMapping | undefined {
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

  save(item: PrimarySlaMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimarySlaMapping[] {
    return this.inner.list();
  }
}

export function newCachedPrimarySlaMappingStore(inner: PrimarySlaMappingStore, ttl: number, clockValue: clock.Clock): PrimarySlaMappingStore {
  return new CachedPrimarySlaMappingStore(inner, cache.newTtlCache<PrimarySlaMapping>(256, ttl, clockValue), 0, 0);
}

/** Selects primary sla mappings. Empty fields match all. */
export class PrimarySlaMappingQuery {
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

  matches(item: PrimarySlaMapping): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimarySlaMapping[]): PrimarySlaMapping[] {
    const matched = collections.filter(items, (candidate: PrimarySlaMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimarySlaMappings(store: PrimarySlaMappingStore, query: PrimarySlaMappingQuery): PrimarySlaMapping[] {
  return query.apply(store.list());
}
