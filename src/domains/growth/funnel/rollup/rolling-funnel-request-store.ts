import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingFunnelRequest } from "./rolling-funnel-request.js";

/** Keeps rolling funnel requests by code. */
export interface RollingFunnelRequestStore {
  find(code: string): RollingFunnelRequest | undefined;
  save(item: RollingFunnelRequest): void;
  remove(code: string): boolean;
  list(): RollingFunnelRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingFunnelRequestStore implements RollingFunnelRequestStore {
  items: Map<string, RollingFunnelRequest>;
  order: string[];

  constructor(items: Map<string, RollingFunnelRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingFunnelRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingFunnelRequest): void {
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

  list(): RollingFunnelRequest[] {
    const out: RollingFunnelRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingFunnelRequestStore(): RollingFunnelRequestStore {
  return new MemoryRollingFunnelRequestStore(new Map<string, RollingFunnelRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingFunnelRequestStore implements RollingFunnelRequestStore {
  inner: RollingFunnelRequestStore;
  cache: cache.TtlCache<RollingFunnelRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingFunnelRequestStore,
    cacheValue: cache.TtlCache<RollingFunnelRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingFunnelRequest | undefined {
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

  save(item: RollingFunnelRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingFunnelRequest[] {
    return this.inner.list();
  }
}

export function newCachedRollingFunnelRequestStore(inner: RollingFunnelRequestStore, ttl: number, clockValue: clock.Clock): RollingFunnelRequestStore {
  return new CachedRollingFunnelRequestStore(
    inner,
    cache.newTtlCache<RollingFunnelRequest>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling funnel requests. Empty fields match all. */
export class RollingFunnelRequestQuery {
  region: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minMargin: number, statuses: string[], limit: number) {
    this.region = region;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingFunnelRequest): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingFunnelRequest[]): RollingFunnelRequest[] {
    const matched = collections.filter(items, (candidate: RollingFunnelRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingFunnelRequests(store: RollingFunnelRequestStore, query: RollingFunnelRequestQuery): RollingFunnelRequest[] {
  return query.apply(store.list());
}
