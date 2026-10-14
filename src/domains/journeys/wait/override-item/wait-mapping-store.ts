import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitMapping } from "./wait-mapping.js";

/** Keeps wait mappings by code. */
export interface WaitMappingStore {
  find(code: string): WaitMapping | undefined;
  save(item: WaitMapping): void;
  remove(code: string): boolean;
  list(): WaitMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitMappingStore implements WaitMappingStore {
  items: Map<string, WaitMapping>;
  order: string[];

  constructor(items: Map<string, WaitMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitMapping): void {
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

  list(): WaitMapping[] {
    const out: WaitMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitMappingStore(): WaitMappingStore {
  return new MemoryWaitMappingStore(new Map<string, WaitMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitMappingStore implements WaitMappingStore {
  inner: WaitMappingStore;
  cache: cache.TtlCache<WaitMapping>;
  hits: number;
  misses: number;

  constructor(inner: WaitMappingStore, cacheValue: cache.TtlCache<WaitMapping>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitMapping | undefined {
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

  save(item: WaitMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitMapping[] {
    return this.inner.list();
  }
}

export function newCachedWaitMappingStore(inner: WaitMappingStore, ttl: number, clockValue: clock.Clock): WaitMappingStore {
  return new CachedWaitMappingStore(inner, cache.newTtlCache<WaitMapping>(256, ttl, clockValue), 0, 0);
}

/** Selects wait mappings. Empty fields match all. */
export class WaitMappingQuery {
  name: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMargin: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitMapping): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitMapping[]): WaitMapping[] {
    const matched = collections.filter(items, (candidate: WaitMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitMappings(store: WaitMappingStore, query: WaitMappingQuery): WaitMapping[] {
  return query.apply(store.list());
}
