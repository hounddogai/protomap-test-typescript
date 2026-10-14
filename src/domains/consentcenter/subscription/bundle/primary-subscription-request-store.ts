import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimarySubscriptionRequest } from "./primary-subscription-request.js";

/** Keeps primary subscription requests by code. */
export interface PrimarySubscriptionRequestStore {
  find(code: string): PrimarySubscriptionRequest | undefined;
  save(item: PrimarySubscriptionRequest): void;
  remove(code: string): boolean;
  list(): PrimarySubscriptionRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimarySubscriptionRequestStore implements PrimarySubscriptionRequestStore {
  items: Map<string, PrimarySubscriptionRequest>;
  order: string[];

  constructor(items: Map<string, PrimarySubscriptionRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimarySubscriptionRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimarySubscriptionRequest): void {
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

  list(): PrimarySubscriptionRequest[] {
    const out: PrimarySubscriptionRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimarySubscriptionRequestStore(): PrimarySubscriptionRequestStore {
  return new MemoryPrimarySubscriptionRequestStore(new Map<string, PrimarySubscriptionRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimarySubscriptionRequestStore implements PrimarySubscriptionRequestStore {
  inner: PrimarySubscriptionRequestStore;
  cache: cache.TtlCache<PrimarySubscriptionRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimarySubscriptionRequestStore,
    cacheValue: cache.TtlCache<PrimarySubscriptionRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimarySubscriptionRequest | undefined {
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

  save(item: PrimarySubscriptionRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimarySubscriptionRequest[] {
    return this.inner.list();
  }
}

export function newCachedPrimarySubscriptionRequestStore(inner: PrimarySubscriptionRequestStore, ttl: number, clockValue: clock.Clock): PrimarySubscriptionRequestStore {
  return new CachedPrimarySubscriptionRequestStore(
    inner,
    cache.newTtlCache<PrimarySubscriptionRequest>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary subscription requests. Empty fields match all. */
export class PrimarySubscriptionRequestQuery {
  channel: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRetries: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimarySubscriptionRequest): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimarySubscriptionRequest[]): PrimarySubscriptionRequest[] {
    const matched = collections.filter(items, (candidate: PrimarySubscriptionRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimarySubscriptionRequests(store: PrimarySubscriptionRequestStore, query: PrimarySubscriptionRequestQuery): PrimarySubscriptionRequest[] {
  return query.apply(store.list());
}
