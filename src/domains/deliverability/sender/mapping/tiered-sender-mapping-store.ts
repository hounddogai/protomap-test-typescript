import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredSenderMapping } from "./tiered-sender-mapping.js";

/** Keeps tiered sender mappings by code. */
export interface TieredSenderMappingStore {
  find(code: string): TieredSenderMapping | undefined;
  save(item: TieredSenderMapping): void;
  remove(code: string): boolean;
  list(): TieredSenderMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredSenderMappingStore implements TieredSenderMappingStore {
  items: Map<string, TieredSenderMapping>;
  order: string[];

  constructor(items: Map<string, TieredSenderMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredSenderMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredSenderMapping): void {
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

  list(): TieredSenderMapping[] {
    const out: TieredSenderMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredSenderMappingStore(): TieredSenderMappingStore {
  return new MemoryTieredSenderMappingStore(new Map<string, TieredSenderMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredSenderMappingStore implements TieredSenderMappingStore {
  inner: TieredSenderMappingStore;
  cache: cache.TtlCache<TieredSenderMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredSenderMappingStore,
    cacheValue: cache.TtlCache<TieredSenderMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredSenderMapping | undefined {
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

  save(item: TieredSenderMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredSenderMapping[] {
    return this.inner.list();
  }
}

export function newCachedTieredSenderMappingStore(inner: TieredSenderMappingStore, ttl: number, clockValue: clock.Clock): TieredSenderMappingStore {
  return new CachedTieredSenderMappingStore(inner, cache.newTtlCache<TieredSenderMapping>(512, ttl, clockValue), 0, 0);
}

/** Selects tiered sender mappings. Empty fields match all. */
export class TieredSenderMappingQuery {
  name: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMaximum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredSenderMapping): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredSenderMapping[]): TieredSenderMapping[] {
    const matched = collections.filter(items, (candidate: TieredSenderMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredSenderMappings(store: TieredSenderMappingStore, query: TieredSenderMappingQuery): TieredSenderMapping[] {
  return query.apply(store.list());
}
