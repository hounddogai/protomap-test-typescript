import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PayoutRequest } from "./payout-request.js";

/** Keeps payout requests by code. */
export interface PayoutRequestStore {
  find(code: string): PayoutRequest | undefined;
  save(item: PayoutRequest): void;
  remove(code: string): boolean;
  list(): PayoutRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPayoutRequestStore implements PayoutRequestStore {
  items: Map<string, PayoutRequest>;
  order: string[];

  constructor(items: Map<string, PayoutRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PayoutRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PayoutRequest): void {
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

  list(): PayoutRequest[] {
    const out: PayoutRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPayoutRequestStore(): PayoutRequestStore {
  return new MemoryPayoutRequestStore(new Map<string, PayoutRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPayoutRequestStore implements PayoutRequestStore {
  inner: PayoutRequestStore;
  cache: cache.TtlCache<PayoutRequest>;
  hits: number;
  misses: number;

  constructor(inner: PayoutRequestStore, cacheValue: cache.TtlCache<PayoutRequest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PayoutRequest | undefined {
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

  save(item: PayoutRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PayoutRequest[] {
    return this.inner.list();
  }
}

export function newCachedPayoutRequestStore(inner: PayoutRequestStore, ttl: number, clockValue: clock.Clock): PayoutRequestStore {
  return new CachedPayoutRequestStore(inner, cache.newTtlCache<PayoutRequest>(1024, ttl, clockValue), 0, 0);
}

/** Selects payout requests. Empty fields match all. */
export class PayoutRequestQuery {
  name: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minScore: number, statuses: string[], limit: number) {
    this.name = name;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PayoutRequest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PayoutRequest[]): PayoutRequest[] {
    const matched = collections.filter(items, (candidate: PayoutRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPayoutRequests(store: PayoutRequestStore, query: PayoutRequestQuery): PayoutRequest[] {
  return query.apply(store.list());
}
