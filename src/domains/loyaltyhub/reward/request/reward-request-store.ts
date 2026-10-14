import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRequest } from "./reward-request.js";

/** Keeps reward requests by code. */
export interface RewardRequestStore {
  find(code: string): RewardRequest | undefined;
  save(item: RewardRequest): void;
  remove(code: string): boolean;
  list(): RewardRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRequestStore implements RewardRequestStore {
  items: Map<string, RewardRequest>;
  order: string[];

  constructor(items: Map<string, RewardRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRequest): void {
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

  list(): RewardRequest[] {
    const out: RewardRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRequestStore(): RewardRequestStore {
  return new MemoryRewardRequestStore(new Map<string, RewardRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRequestStore implements RewardRequestStore {
  inner: RewardRequestStore;
  cache: cache.TtlCache<RewardRequest>;
  hits: number;
  misses: number;

  constructor(inner: RewardRequestStore, cacheValue: cache.TtlCache<RewardRequest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRequest | undefined {
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

  save(item: RewardRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRequest[] {
    return this.inner.list();
  }
}

export function newCachedRewardRequestStore(inner: RewardRequestStore, ttl: number, clockValue: clock.Clock): RewardRequestStore {
  return new CachedRewardRequestStore(inner, cache.newTtlCache<RewardRequest>(256, ttl, clockValue), 0, 0);
}

/** Selects reward requests. Empty fields match all. */
export class RewardRequestQuery {
  label: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRetries: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRequest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRequest[]): RewardRequest[] {
    const matched = collections.filter(items, (candidate: RewardRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRequests(store: RewardRequestStore, query: RewardRequestQuery): RewardRequest[] {
  return query.apply(store.list());
}
