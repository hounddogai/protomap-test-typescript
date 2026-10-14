import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitRequest } from "./wait-request.js";

/** Keeps wait requests by code. */
export interface WaitRequestStore {
  find(code: string): WaitRequest | undefined;
  save(item: WaitRequest): void;
  remove(code: string): boolean;
  list(): WaitRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitRequestStore implements WaitRequestStore {
  items: Map<string, WaitRequest>;
  order: string[];

  constructor(items: Map<string, WaitRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitRequest): void {
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

  list(): WaitRequest[] {
    const out: WaitRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitRequestStore(): WaitRequestStore {
  return new MemoryWaitRequestStore(new Map<string, WaitRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitRequestStore implements WaitRequestStore {
  inner: WaitRequestStore;
  cache: cache.TtlCache<WaitRequest>;
  hits: number;
  misses: number;

  constructor(inner: WaitRequestStore, cacheValue: cache.TtlCache<WaitRequest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitRequest | undefined {
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

  save(item: WaitRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitRequest[] {
    return this.inner.list();
  }
}

export function newCachedWaitRequestStore(inner: WaitRequestStore, ttl: number, clockValue: clock.Clock): WaitRequestStore {
  return new CachedWaitRequestStore(inner, cache.newTtlCache<WaitRequest>(128, ttl, clockValue), 0, 0);
}

/** Selects wait requests. Empty fields match all. */
export class WaitRequestQuery {
  segment: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minAttempts: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitRequest): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitRequest[]): WaitRequest[] {
    const matched = collections.filter(items, (candidate: WaitRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitRequests(store: WaitRequestStore, query: WaitRequestQuery): WaitRequest[] {
  return query.apply(store.list());
}
