import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredSlaMapping } from "./tiered-sla-mapping.js";

/** Keeps tiered sla mappings by code. */
export interface TieredSlaMappingStore {
  find(code: string): TieredSlaMapping | undefined;
  save(item: TieredSlaMapping): void;
  remove(code: string): boolean;
  list(): TieredSlaMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredSlaMappingStore implements TieredSlaMappingStore {
  items: Map<string, TieredSlaMapping>;
  order: string[];

  constructor(items: Map<string, TieredSlaMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredSlaMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredSlaMapping): void {
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

  list(): TieredSlaMapping[] {
    const out: TieredSlaMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredSlaMappingStore(): TieredSlaMappingStore {
  return new MemoryTieredSlaMappingStore(new Map<string, TieredSlaMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredSlaMappingStore implements TieredSlaMappingStore {
  inner: TieredSlaMappingStore;
  cache: cache.TtlCache<TieredSlaMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredSlaMappingStore,
    cacheValue: cache.TtlCache<TieredSlaMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredSlaMapping | undefined {
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

  save(item: TieredSlaMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredSlaMapping[] {
    return this.inner.list();
  }
}

export function newCachedTieredSlaMappingStore(inner: TieredSlaMappingStore, ttl: number, clockValue: clock.Clock): TieredSlaMappingStore {
  return new CachedTieredSlaMappingStore(inner, cache.newTtlCache<TieredSlaMapping>(64, ttl, clockValue), 0, 0);
}

/** Selects tiered sla mappings. Empty fields match all. */
export class TieredSlaMappingQuery {
  locale: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredSlaMapping): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredSlaMapping[]): TieredSlaMapping[] {
    const matched = collections.filter(items, (candidate: TieredSlaMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredSlaMappings(store: TieredSlaMappingStore, query: TieredSlaMappingQuery): TieredSlaMapping[] {
  return query.apply(store.list());
}
