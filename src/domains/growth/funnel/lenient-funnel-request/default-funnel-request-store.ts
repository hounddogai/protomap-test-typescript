import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultFunnelRequest } from "./default-funnel-request.js";

/** Keeps default funnel requests by code. */
export interface DefaultFunnelRequestStore {
  find(code: string): DefaultFunnelRequest | undefined;
  save(item: DefaultFunnelRequest): void;
  remove(code: string): boolean;
  list(): DefaultFunnelRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultFunnelRequestStore implements DefaultFunnelRequestStore {
  items: Map<string, DefaultFunnelRequest>;
  order: string[];

  constructor(items: Map<string, DefaultFunnelRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultFunnelRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultFunnelRequest): void {
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

  list(): DefaultFunnelRequest[] {
    const out: DefaultFunnelRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultFunnelRequestStore(): DefaultFunnelRequestStore {
  return new MemoryDefaultFunnelRequestStore(new Map<string, DefaultFunnelRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultFunnelRequestStore implements DefaultFunnelRequestStore {
  inner: DefaultFunnelRequestStore;
  cache: cache.TtlCache<DefaultFunnelRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultFunnelRequestStore,
    cacheValue: cache.TtlCache<DefaultFunnelRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultFunnelRequest | undefined {
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

  save(item: DefaultFunnelRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultFunnelRequest[] {
    return this.inner.list();
  }
}

export function newCachedDefaultFunnelRequestStore(inner: DefaultFunnelRequestStore, ttl: number, clockValue: clock.Clock): DefaultFunnelRequestStore {
  return new CachedDefaultFunnelRequestStore(
    inner,
    cache.newTtlCache<DefaultFunnelRequest>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default funnel requests. Empty fields match all. */
export class DefaultFunnelRequestQuery {
  utmSource: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minEndsAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultFunnelRequest): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultFunnelRequest[]): DefaultFunnelRequest[] {
    const matched = collections.filter(items, (candidate: DefaultFunnelRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultFunnelRequests(store: DefaultFunnelRequestStore, query: DefaultFunnelRequestQuery): DefaultFunnelRequest[] {
  return query.apply(store.list());
}
