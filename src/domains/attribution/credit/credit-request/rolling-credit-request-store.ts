import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingCreditRequest } from "./rolling-credit-request.js";

/** Keeps rolling credit requests by code. */
export interface RollingCreditRequestStore {
  find(code: string): RollingCreditRequest | undefined;
  save(item: RollingCreditRequest): void;
  remove(code: string): boolean;
  list(): RollingCreditRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingCreditRequestStore implements RollingCreditRequestStore {
  items: Map<string, RollingCreditRequest>;
  order: string[];

  constructor(items: Map<string, RollingCreditRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingCreditRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingCreditRequest): void {
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

  list(): RollingCreditRequest[] {
    const out: RollingCreditRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingCreditRequestStore(): RollingCreditRequestStore {
  return new MemoryRollingCreditRequestStore(new Map<string, RollingCreditRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingCreditRequestStore implements RollingCreditRequestStore {
  inner: RollingCreditRequestStore;
  cache: cache.TtlCache<RollingCreditRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingCreditRequestStore,
    cacheValue: cache.TtlCache<RollingCreditRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingCreditRequest | undefined {
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

  save(item: RollingCreditRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingCreditRequest[] {
    return this.inner.list();
  }
}

export function newCachedRollingCreditRequestStore(inner: RollingCreditRequestStore, ttl: number, clockValue: clock.Clock): RollingCreditRequestStore {
  return new CachedRollingCreditRequestStore(
    inner,
    cache.newTtlCache<RollingCreditRequest>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling credit requests. Empty fields match all. */
export class RollingCreditRequestQuery {
  category: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minAttempts: number, statuses: string[], limit: number) {
    this.category = category;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingCreditRequest): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingCreditRequest[]): RollingCreditRequest[] {
    const matched = collections.filter(items, (candidate: RollingCreditRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingCreditRequests(store: RollingCreditRequestStore, query: RollingCreditRequestQuery): RollingCreditRequest[] {
  return query.apply(store.list());
}
