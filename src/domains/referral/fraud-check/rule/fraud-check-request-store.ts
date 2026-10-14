import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckRequest } from "./fraud-check-request.js";

/** Keeps fraud check requests by code. */
export interface FraudCheckRequestStore {
  find(code: string): FraudCheckRequest | undefined;
  save(item: FraudCheckRequest): void;
  remove(code: string): boolean;
  list(): FraudCheckRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckRequestStore implements FraudCheckRequestStore {
  items: Map<string, FraudCheckRequest>;
  order: string[];

  constructor(items: Map<string, FraudCheckRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckRequest): void {
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

  list(): FraudCheckRequest[] {
    const out: FraudCheckRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckRequestStore(): FraudCheckRequestStore {
  return new MemoryFraudCheckRequestStore(new Map<string, FraudCheckRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckRequestStore implements FraudCheckRequestStore {
  inner: FraudCheckRequestStore;
  cache: cache.TtlCache<FraudCheckRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckRequestStore,
    cacheValue: cache.TtlCache<FraudCheckRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckRequest | undefined {
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

  save(item: FraudCheckRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckRequest[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckRequestStore(inner: FraudCheckRequestStore, ttl: number, clockValue: clock.Clock): FraudCheckRequestStore {
  return new CachedFraudCheckRequestStore(inner, cache.newTtlCache<FraudCheckRequest>(256, ttl, clockValue), 0, 0);
}

/** Selects fraud check requests. Empty fields match all. */
export class FraudCheckRequestQuery {
  country: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minSequence: number, statuses: string[], limit: number) {
    this.country = country;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckRequest): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckRequest[]): FraudCheckRequest[] {
    const matched = collections.filter(items, (candidate: FraudCheckRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckRequests(store: FraudCheckRequestStore, query: FraudCheckRequestQuery): FraudCheckRequest[] {
  return query.apply(store.list());
}
