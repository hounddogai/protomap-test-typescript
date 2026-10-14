import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingRewardRequest } from "./rolling-reward-request.js";

/** Keeps rolling reward requests by code. */
export interface RollingRewardRequestStore {
  find(code: string): RollingRewardRequest | undefined;
  save(item: RollingRewardRequest): void;
  remove(code: string): boolean;
  list(): RollingRewardRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingRewardRequestStore implements RollingRewardRequestStore {
  items: Map<string, RollingRewardRequest>;
  order: string[];

  constructor(items: Map<string, RollingRewardRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingRewardRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingRewardRequest): void {
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

  list(): RollingRewardRequest[] {
    const out: RollingRewardRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingRewardRequestStore(): RollingRewardRequestStore {
  return new MemoryRollingRewardRequestStore(new Map<string, RollingRewardRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingRewardRequestStore implements RollingRewardRequestStore {
  inner: RollingRewardRequestStore;
  cache: cache.TtlCache<RollingRewardRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingRewardRequestStore,
    cacheValue: cache.TtlCache<RollingRewardRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingRewardRequest | undefined {
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

  save(item: RollingRewardRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingRewardRequest[] {
    return this.inner.list();
  }
}

export function newCachedRollingRewardRequestStore(inner: RollingRewardRequestStore, ttl: number, clockValue: clock.Clock): RollingRewardRequestStore {
  return new CachedRollingRewardRequestStore(inner, cache.newTtlCache<RollingRewardRequest>(64, ttl, clockValue), 0, 0);
}

/** Selects rolling reward requests. Empty fields match all. */
export class RollingRewardRequestQuery {
  region: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minAttempts: number, statuses: string[], limit: number) {
    this.region = region;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingRewardRequest): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingRewardRequest[]): RollingRewardRequest[] {
    const matched = collections.filter(items, (candidate: RollingRewardRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingRewardRequests(store: RollingRewardRequestStore, query: RollingRewardRequestQuery): RollingRewardRequest[] {
  return query.apply(store.list());
}
