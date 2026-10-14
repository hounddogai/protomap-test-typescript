import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackRewardRequest } from "./fallback-reward-request.js";

/** Keeps fallback reward requests by code. */
export interface FallbackRewardRequestStore {
  find(code: string): FallbackRewardRequest | undefined;
  save(item: FallbackRewardRequest): void;
  remove(code: string): boolean;
  list(): FallbackRewardRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackRewardRequestStore implements FallbackRewardRequestStore {
  items: Map<string, FallbackRewardRequest>;
  order: string[];

  constructor(items: Map<string, FallbackRewardRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackRewardRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackRewardRequest): void {
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

  list(): FallbackRewardRequest[] {
    const out: FallbackRewardRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackRewardRequestStore(): FallbackRewardRequestStore {
  return new MemoryFallbackRewardRequestStore(new Map<string, FallbackRewardRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackRewardRequestStore implements FallbackRewardRequestStore {
  inner: FallbackRewardRequestStore;
  cache: cache.TtlCache<FallbackRewardRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackRewardRequestStore,
    cacheValue: cache.TtlCache<FallbackRewardRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackRewardRequest | undefined {
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

  save(item: FallbackRewardRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackRewardRequest[] {
    return this.inner.list();
  }
}

export function newCachedFallbackRewardRequestStore(inner: FallbackRewardRequestStore, ttl: number, clockValue: clock.Clock): FallbackRewardRequestStore {
  return new CachedFallbackRewardRequestStore(
    inner,
    cache.newTtlCache<FallbackRewardRequest>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback reward requests. Empty fields match all. */
export class FallbackRewardRequestQuery {
  category: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.category = category;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackRewardRequest): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackRewardRequest[]): FallbackRewardRequest[] {
    const matched = collections.filter(items, (candidate: FallbackRewardRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackRewardRequests(store: FallbackRewardRequestStore, query: FallbackRewardRequestQuery): FallbackRewardRequest[] {
  return query.apply(store.list());
}
