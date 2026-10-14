import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallRequest } from "./paywall-request.js";

/** Keeps paywall requests by code. */
export interface PaywallRequestStore {
  find(code: string): PaywallRequest | undefined;
  save(item: PaywallRequest): void;
  remove(code: string): boolean;
  list(): PaywallRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallRequestStore implements PaywallRequestStore {
  items: Map<string, PaywallRequest>;
  order: string[];

  constructor(items: Map<string, PaywallRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallRequest): void {
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

  list(): PaywallRequest[] {
    const out: PaywallRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallRequestStore(): PaywallRequestStore {
  return new MemoryPaywallRequestStore(new Map<string, PaywallRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallRequestStore implements PaywallRequestStore {
  inner: PaywallRequestStore;
  cache: cache.TtlCache<PaywallRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: PaywallRequestStore,
    cacheValue: cache.TtlCache<PaywallRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallRequest | undefined {
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

  save(item: PaywallRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallRequest[] {
    return this.inner.list();
  }
}

export function newCachedPaywallRequestStore(inner: PaywallRequestStore, ttl: number, clockValue: clock.Clock): PaywallRequestStore {
  return new CachedPaywallRequestStore(inner, cache.newTtlCache<PaywallRequest>(64, ttl, clockValue), 0, 0);
}

/** Selects paywall requests. Empty fields match all. */
export class PaywallRequestQuery {
  region: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minRetries: number, statuses: string[], limit: number) {
    this.region = region;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallRequest): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallRequest[]): PaywallRequest[] {
    const matched = collections.filter(items, (candidate: PaywallRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallRequests(store: PaywallRequestStore, query: PaywallRequestQuery): PaywallRequest[] {
  return query.apply(store.list());
}
