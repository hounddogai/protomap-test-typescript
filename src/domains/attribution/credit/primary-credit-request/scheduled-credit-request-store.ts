import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledCreditRequest } from "./scheduled-credit-request.js";

/** Keeps scheduled credit requests by code. */
export interface ScheduledCreditRequestStore {
  find(code: string): ScheduledCreditRequest | undefined;
  save(item: ScheduledCreditRequest): void;
  remove(code: string): boolean;
  list(): ScheduledCreditRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledCreditRequestStore implements ScheduledCreditRequestStore {
  items: Map<string, ScheduledCreditRequest>;
  order: string[];

  constructor(items: Map<string, ScheduledCreditRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledCreditRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledCreditRequest): void {
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

  list(): ScheduledCreditRequest[] {
    const out: ScheduledCreditRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledCreditRequestStore(): ScheduledCreditRequestStore {
  return new MemoryScheduledCreditRequestStore(new Map<string, ScheduledCreditRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledCreditRequestStore implements ScheduledCreditRequestStore {
  inner: ScheduledCreditRequestStore;
  cache: cache.TtlCache<ScheduledCreditRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledCreditRequestStore,
    cacheValue: cache.TtlCache<ScheduledCreditRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledCreditRequest | undefined {
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

  save(item: ScheduledCreditRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledCreditRequest[] {
    return this.inner.list();
  }
}

export function newCachedScheduledCreditRequestStore(inner: ScheduledCreditRequestStore, ttl: number, clockValue: clock.Clock): ScheduledCreditRequestStore {
  return new CachedScheduledCreditRequestStore(
    inner,
    cache.newTtlCache<ScheduledCreditRequest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled credit requests. Empty fields match all. */
export class ScheduledCreditRequestQuery {
  name: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minQuantity: number, statuses: string[], limit: number) {
    this.name = name;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledCreditRequest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledCreditRequest[]): ScheduledCreditRequest[] {
    const matched = collections.filter(items, (candidate: ScheduledCreditRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledCreditRequests(store: ScheduledCreditRequestStore, query: ScheduledCreditRequestQuery): ScheduledCreditRequest[] {
  return query.apply(store.list());
}
