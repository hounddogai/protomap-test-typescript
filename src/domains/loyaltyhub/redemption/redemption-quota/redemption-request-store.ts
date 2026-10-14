import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionRequest } from "./redemption-request.js";

/** Keeps redemption requests by code. */
export interface RedemptionRequestStore {
  find(code: string): RedemptionRequest | undefined;
  save(item: RedemptionRequest): void;
  remove(code: string): boolean;
  list(): RedemptionRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionRequestStore implements RedemptionRequestStore {
  items: Map<string, RedemptionRequest>;
  order: string[];

  constructor(items: Map<string, RedemptionRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionRequest): void {
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

  list(): RedemptionRequest[] {
    const out: RedemptionRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionRequestStore(): RedemptionRequestStore {
  return new MemoryRedemptionRequestStore(new Map<string, RedemptionRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionRequestStore implements RedemptionRequestStore {
  inner: RedemptionRequestStore;
  cache: cache.TtlCache<RedemptionRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionRequestStore,
    cacheValue: cache.TtlCache<RedemptionRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionRequest | undefined {
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

  save(item: RedemptionRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionRequest[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionRequestStore(inner: RedemptionRequestStore, ttl: number, clockValue: clock.Clock): RedemptionRequestStore {
  return new CachedRedemptionRequestStore(inner, cache.newTtlCache<RedemptionRequest>(512, ttl, clockValue), 0, 0);
}

/** Selects redemption requests. Empty fields match all. */
export class RedemptionRequestQuery {
  name: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minEndsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionRequest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionRequest[]): RedemptionRequest[] {
    const matched = collections.filter(items, (candidate: RedemptionRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionRequests(store: RedemptionRequestStore, query: RedemptionRequestQuery): RedemptionRequest[] {
  return query.apply(store.list());
}
