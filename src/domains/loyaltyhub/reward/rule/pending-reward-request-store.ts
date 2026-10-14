import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingRewardRequest } from "./pending-reward-request.js";

/** Keeps pending reward requests by code. */
export interface PendingRewardRequestStore {
  find(code: string): PendingRewardRequest | undefined;
  save(item: PendingRewardRequest): void;
  remove(code: string): boolean;
  list(): PendingRewardRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingRewardRequestStore implements PendingRewardRequestStore {
  items: Map<string, PendingRewardRequest>;
  order: string[];

  constructor(items: Map<string, PendingRewardRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingRewardRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingRewardRequest): void {
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

  list(): PendingRewardRequest[] {
    const out: PendingRewardRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingRewardRequestStore(): PendingRewardRequestStore {
  return new MemoryPendingRewardRequestStore(new Map<string, PendingRewardRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingRewardRequestStore implements PendingRewardRequestStore {
  inner: PendingRewardRequestStore;
  cache: cache.TtlCache<PendingRewardRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingRewardRequestStore,
    cacheValue: cache.TtlCache<PendingRewardRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingRewardRequest | undefined {
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

  save(item: PendingRewardRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingRewardRequest[] {
    return this.inner.list();
  }
}

export function newCachedPendingRewardRequestStore(inner: PendingRewardRequestStore, ttl: number, clockValue: clock.Clock): PendingRewardRequestStore {
  return new CachedPendingRewardRequestStore(
    inner,
    cache.newTtlCache<PendingRewardRequest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending reward requests. Empty fields match all. */
export class PendingRewardRequestQuery {
  utmSource: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minAttempts: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingRewardRequest): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingRewardRequest[]): PendingRewardRequest[] {
    const matched = collections.filter(items, (candidate: PendingRewardRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingRewardRequests(store: PendingRewardRequestStore, query: PendingRewardRequestQuery): PendingRewardRequest[] {
  return query.apply(store.list());
}
