import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelRequest } from "./funnel-request.js";

/** Keeps funnel requests by code. */
export interface FunnelRequestStore {
  find(code: string): FunnelRequest | undefined;
  save(item: FunnelRequest): void;
  remove(code: string): boolean;
  list(): FunnelRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelRequestStore implements FunnelRequestStore {
  items: Map<string, FunnelRequest>;
  order: string[];

  constructor(items: Map<string, FunnelRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelRequest): void {
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

  list(): FunnelRequest[] {
    const out: FunnelRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelRequestStore(): FunnelRequestStore {
  return new MemoryFunnelRequestStore(new Map<string, FunnelRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelRequestStore implements FunnelRequestStore {
  inner: FunnelRequestStore;
  cache: cache.TtlCache<FunnelRequest>;
  hits: number;
  misses: number;

  constructor(inner: FunnelRequestStore, cacheValue: cache.TtlCache<FunnelRequest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelRequest | undefined {
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

  save(item: FunnelRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelRequest[] {
    return this.inner.list();
  }
}

export function newCachedFunnelRequestStore(inner: FunnelRequestStore, ttl: number, clockValue: clock.Clock): FunnelRequestStore {
  return new CachedFunnelRequestStore(inner, cache.newTtlCache<FunnelRequest>(1024, ttl, clockValue), 0, 0);
}

/** Selects funnel requests. Empty fields match all. */
export class FunnelRequestQuery {
  title: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelRequest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelRequest[]): FunnelRequest[] {
    const matched = collections.filter(items, (candidate: FunnelRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelRequests(store: FunnelRequestStore, query: FunnelRequestQuery): FunnelRequest[] {
  return query.apply(store.list());
}
