import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceRequest } from "./bounce-request.js";

/** Keeps bounce requests by code. */
export interface BounceRequestStore {
  find(code: string): BounceRequest | undefined;
  save(item: BounceRequest): void;
  remove(code: string): boolean;
  list(): BounceRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceRequestStore implements BounceRequestStore {
  items: Map<string, BounceRequest>;
  order: string[];

  constructor(items: Map<string, BounceRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceRequest): void {
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

  list(): BounceRequest[] {
    const out: BounceRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceRequestStore(): BounceRequestStore {
  return new MemoryBounceRequestStore(new Map<string, BounceRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceRequestStore implements BounceRequestStore {
  inner: BounceRequestStore;
  cache: cache.TtlCache<BounceRequest>;
  hits: number;
  misses: number;

  constructor(inner: BounceRequestStore, cacheValue: cache.TtlCache<BounceRequest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceRequest | undefined {
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

  save(item: BounceRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceRequest[] {
    return this.inner.list();
  }
}

export function newCachedBounceRequestStore(inner: BounceRequestStore, ttl: number, clockValue: clock.Clock): BounceRequestStore {
  return new CachedBounceRequestStore(inner, cache.newTtlCache<BounceRequest>(64, ttl, clockValue), 0, 0);
}

/** Selects bounce requests. Empty fields match all. */
export class BounceRequestQuery {
  utmSource: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceRequest): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceRequest[]): BounceRequest[] {
    const matched = collections.filter(items, (candidate: BounceRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceRequests(store: BounceRequestStore, query: BounceRequestQuery): BounceRequest[] {
  return query.apply(store.list());
}
