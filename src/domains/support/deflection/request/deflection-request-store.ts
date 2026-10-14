import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionRequest } from "./deflection-request.js";

/** Keeps deflection requests by code. */
export interface DeflectionRequestStore {
  find(code: string): DeflectionRequest | undefined;
  save(item: DeflectionRequest): void;
  remove(code: string): boolean;
  list(): DeflectionRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionRequestStore implements DeflectionRequestStore {
  items: Map<string, DeflectionRequest>;
  order: string[];

  constructor(items: Map<string, DeflectionRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionRequest): void {
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

  list(): DeflectionRequest[] {
    const out: DeflectionRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionRequestStore(): DeflectionRequestStore {
  return new MemoryDeflectionRequestStore(new Map<string, DeflectionRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionRequestStore implements DeflectionRequestStore {
  inner: DeflectionRequestStore;
  cache: cache.TtlCache<DeflectionRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionRequestStore,
    cacheValue: cache.TtlCache<DeflectionRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionRequest | undefined {
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

  save(item: DeflectionRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionRequest[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionRequestStore(inner: DeflectionRequestStore, ttl: number, clockValue: clock.Clock): DeflectionRequestStore {
  return new CachedDeflectionRequestStore(inner, cache.newTtlCache<DeflectionRequest>(64, ttl, clockValue), 0, 0);
}

/** Selects deflection requests. Empty fields match all. */
export class DeflectionRequestQuery {
  utmSource: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionRequest): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionRequest[]): DeflectionRequest[] {
    const matched = collections.filter(items, (candidate: DeflectionRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionRequests(store: DeflectionRequestStore, query: DeflectionRequestQuery): DeflectionRequest[] {
  return query.apply(store.list());
}
