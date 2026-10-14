import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackCohortRequest } from "./fallback-cohort-request.js";

/** Keeps fallback cohort requests by code. */
export interface FallbackCohortRequestStore {
  find(code: string): FallbackCohortRequest | undefined;
  save(item: FallbackCohortRequest): void;
  remove(code: string): boolean;
  list(): FallbackCohortRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackCohortRequestStore implements FallbackCohortRequestStore {
  items: Map<string, FallbackCohortRequest>;
  order: string[];

  constructor(items: Map<string, FallbackCohortRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackCohortRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackCohortRequest): void {
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

  list(): FallbackCohortRequest[] {
    const out: FallbackCohortRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackCohortRequestStore(): FallbackCohortRequestStore {
  return new MemoryFallbackCohortRequestStore(new Map<string, FallbackCohortRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackCohortRequestStore implements FallbackCohortRequestStore {
  inner: FallbackCohortRequestStore;
  cache: cache.TtlCache<FallbackCohortRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackCohortRequestStore,
    cacheValue: cache.TtlCache<FallbackCohortRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackCohortRequest | undefined {
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

  save(item: FallbackCohortRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackCohortRequest[] {
    return this.inner.list();
  }
}

export function newCachedFallbackCohortRequestStore(inner: FallbackCohortRequestStore, ttl: number, clockValue: clock.Clock): FallbackCohortRequestStore {
  return new CachedFallbackCohortRequestStore(
    inner,
    cache.newTtlCache<FallbackCohortRequest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback cohort requests. Empty fields match all. */
export class FallbackCohortRequestQuery {
  name: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minPriority: number, statuses: string[], limit: number) {
    this.name = name;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackCohortRequest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackCohortRequest[]): FallbackCohortRequest[] {
    const matched = collections.filter(items, (candidate: FallbackCohortRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackCohortRequests(store: FallbackCohortRequestStore, query: FallbackCohortRequestQuery): FallbackCohortRequest[] {
  return query.apply(store.list());
}
