import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalPathRequest } from "./regional-path-request.js";

/** Keeps regional path requests by code. */
export interface RegionalPathRequestStore {
  find(code: string): RegionalPathRequest | undefined;
  save(item: RegionalPathRequest): void;
  remove(code: string): boolean;
  list(): RegionalPathRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalPathRequestStore implements RegionalPathRequestStore {
  items: Map<string, RegionalPathRequest>;
  order: string[];

  constructor(items: Map<string, RegionalPathRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalPathRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalPathRequest): void {
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

  list(): RegionalPathRequest[] {
    const out: RegionalPathRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalPathRequestStore(): RegionalPathRequestStore {
  return new MemoryRegionalPathRequestStore(new Map<string, RegionalPathRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalPathRequestStore implements RegionalPathRequestStore {
  inner: RegionalPathRequestStore;
  cache: cache.TtlCache<RegionalPathRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalPathRequestStore,
    cacheValue: cache.TtlCache<RegionalPathRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalPathRequest | undefined {
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

  save(item: RegionalPathRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalPathRequest[] {
    return this.inner.list();
  }
}

export function newCachedRegionalPathRequestStore(inner: RegionalPathRequestStore, ttl: number, clockValue: clock.Clock): RegionalPathRequestStore {
  return new CachedRegionalPathRequestStore(inner, cache.newTtlCache<RegionalPathRequest>(1024, ttl, clockValue), 0, 0);
}

/** Selects regional path requests. Empty fields match all. */
export class RegionalPathRequestQuery {
  category: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minCapacity: number, statuses: string[], limit: number) {
    this.category = category;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalPathRequest): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalPathRequest[]): RegionalPathRequest[] {
    const matched = collections.filter(items, (candidate: RegionalPathRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalPathRequests(store: RegionalPathRequestStore, query: RegionalPathRequestQuery): RegionalPathRequest[] {
  return query.apply(store.list());
}
