import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TouchpointRequest } from "./touchpoint-request.js";

/** Keeps touchpoint requests by code. */
export interface TouchpointRequestStore {
  find(code: string): TouchpointRequest | undefined;
  save(item: TouchpointRequest): void;
  remove(code: string): boolean;
  list(): TouchpointRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTouchpointRequestStore implements TouchpointRequestStore {
  items: Map<string, TouchpointRequest>;
  order: string[];

  constructor(items: Map<string, TouchpointRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TouchpointRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TouchpointRequest): void {
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

  list(): TouchpointRequest[] {
    const out: TouchpointRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTouchpointRequestStore(): TouchpointRequestStore {
  return new MemoryTouchpointRequestStore(new Map<string, TouchpointRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTouchpointRequestStore implements TouchpointRequestStore {
  inner: TouchpointRequestStore;
  cache: cache.TtlCache<TouchpointRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: TouchpointRequestStore,
    cacheValue: cache.TtlCache<TouchpointRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TouchpointRequest | undefined {
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

  save(item: TouchpointRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TouchpointRequest[] {
    return this.inner.list();
  }
}

export function newCachedTouchpointRequestStore(inner: TouchpointRequestStore, ttl: number, clockValue: clock.Clock): TouchpointRequestStore {
  return new CachedTouchpointRequestStore(inner, cache.newTtlCache<TouchpointRequest>(1024, ttl, clockValue), 0, 0);
}

/** Selects touchpoint requests. Empty fields match all. */
export class TouchpointRequestQuery {
  name: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSequence: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TouchpointRequest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TouchpointRequest[]): TouchpointRequest[] {
    const matched = collections.filter(items, (candidate: TouchpointRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTouchpointRequests(store: TouchpointRequestStore, query: TouchpointRequestQuery): TouchpointRequest[] {
  return query.apply(store.list());
}
