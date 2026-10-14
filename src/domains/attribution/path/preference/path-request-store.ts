import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathRequest } from "./path-request.js";

/** Keeps path requests by code. */
export interface PathRequestStore {
  find(code: string): PathRequest | undefined;
  save(item: PathRequest): void;
  remove(code: string): boolean;
  list(): PathRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathRequestStore implements PathRequestStore {
  items: Map<string, PathRequest>;
  order: string[];

  constructor(items: Map<string, PathRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathRequest): void {
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

  list(): PathRequest[] {
    const out: PathRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathRequestStore(): PathRequestStore {
  return new MemoryPathRequestStore(new Map<string, PathRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathRequestStore implements PathRequestStore {
  inner: PathRequestStore;
  cache: cache.TtlCache<PathRequest>;
  hits: number;
  misses: number;

  constructor(inner: PathRequestStore, cacheValue: cache.TtlCache<PathRequest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathRequest | undefined {
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

  save(item: PathRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathRequest[] {
    return this.inner.list();
  }
}

export function newCachedPathRequestStore(inner: PathRequestStore, ttl: number, clockValue: clock.Clock): PathRequestStore {
  return new CachedPathRequestStore(inner, cache.newTtlCache<PathRequest>(1024, ttl, clockValue), 0, 0);
}

/** Selects path requests. Empty fields match all. */
export class PathRequestQuery {
  segment: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minImpressions: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathRequest): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathRequest[]): PathRequest[] {
    const matched = collections.filter(items, (candidate: PathRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathRequests(store: PathRequestStore, query: PathRequestQuery): PathRequest[] {
  return query.apply(store.list());
}
