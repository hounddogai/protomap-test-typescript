import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupRequest } from "./warmup-request.js";

/** Keeps warmup requests by code. */
export interface WarmupRequestStore {
  find(code: string): WarmupRequest | undefined;
  save(item: WarmupRequest): void;
  remove(code: string): boolean;
  list(): WarmupRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupRequestStore implements WarmupRequestStore {
  items: Map<string, WarmupRequest>;
  order: string[];

  constructor(items: Map<string, WarmupRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupRequest): void {
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

  list(): WarmupRequest[] {
    const out: WarmupRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupRequestStore(): WarmupRequestStore {
  return new MemoryWarmupRequestStore(new Map<string, WarmupRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupRequestStore implements WarmupRequestStore {
  inner: WarmupRequestStore;
  cache: cache.TtlCache<WarmupRequest>;
  hits: number;
  misses: number;

  constructor(inner: WarmupRequestStore, cacheValue: cache.TtlCache<WarmupRequest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupRequest | undefined {
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

  save(item: WarmupRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupRequest[] {
    return this.inner.list();
  }
}

export function newCachedWarmupRequestStore(inner: WarmupRequestStore, ttl: number, clockValue: clock.Clock): WarmupRequestStore {
  return new CachedWarmupRequestStore(inner, cache.newTtlCache<WarmupRequest>(64, ttl, clockValue), 0, 0);
}

/** Selects warmup requests. Empty fields match all. */
export class WarmupRequestQuery {
  utmSource: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minRevision: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupRequest): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupRequest[]): WarmupRequest[] {
    const matched = collections.filter(items, (candidate: WarmupRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupRequests(store: WarmupRequestStore, query: WarmupRequestQuery): WarmupRequest[] {
  return query.apply(store.list());
}
