import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionRequest } from "./retention-request.js";

/** Keeps retention requests by code. */
export interface RetentionRequestStore {
  find(code: string): RetentionRequest | undefined;
  save(item: RetentionRequest): void;
  remove(code: string): boolean;
  list(): RetentionRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionRequestStore implements RetentionRequestStore {
  items: Map<string, RetentionRequest>;
  order: string[];

  constructor(items: Map<string, RetentionRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionRequest): void {
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

  list(): RetentionRequest[] {
    const out: RetentionRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionRequestStore(): RetentionRequestStore {
  return new MemoryRetentionRequestStore(new Map<string, RetentionRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionRequestStore implements RetentionRequestStore {
  inner: RetentionRequestStore;
  cache: cache.TtlCache<RetentionRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionRequestStore,
    cacheValue: cache.TtlCache<RetentionRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionRequest | undefined {
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

  save(item: RetentionRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionRequest[] {
    return this.inner.list();
  }
}

export function newCachedRetentionRequestStore(inner: RetentionRequestStore, ttl: number, clockValue: clock.Clock): RetentionRequestStore {
  return new CachedRetentionRequestStore(inner, cache.newTtlCache<RetentionRequest>(1024, ttl, clockValue), 0, 0);
}

/** Selects retention requests. Empty fields match all. */
export class RetentionRequestQuery {
  unit: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minWindowDays: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionRequest): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionRequest[]): RetentionRequest[] {
    const matched = collections.filter(items, (candidate: RetentionRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionRequests(store: RetentionRequestStore, query: RetentionRequestQuery): RetentionRequest[] {
  return query.apply(store.list());
}
