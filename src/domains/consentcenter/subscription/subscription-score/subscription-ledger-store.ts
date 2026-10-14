import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionLedger } from "./subscription-ledger.js";

/** Keeps subscription ledgers by code. */
export interface SubscriptionLedgerStore {
  find(code: string): SubscriptionLedger | undefined;
  save(item: SubscriptionLedger): void;
  remove(code: string): boolean;
  list(): SubscriptionLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionLedgerStore implements SubscriptionLedgerStore {
  items: Map<string, SubscriptionLedger>;
  order: string[];

  constructor(items: Map<string, SubscriptionLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionLedger): void {
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

  list(): SubscriptionLedger[] {
    const out: SubscriptionLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionLedgerStore(): SubscriptionLedgerStore {
  return new MemorySubscriptionLedgerStore(new Map<string, SubscriptionLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionLedgerStore implements SubscriptionLedgerStore {
  inner: SubscriptionLedgerStore;
  cache: cache.TtlCache<SubscriptionLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionLedgerStore,
    cacheValue: cache.TtlCache<SubscriptionLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionLedger | undefined {
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

  save(item: SubscriptionLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionLedger[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionLedgerStore(inner: SubscriptionLedgerStore, ttl: number, clockValue: clock.Clock): SubscriptionLedgerStore {
  return new CachedSubscriptionLedgerStore(inner, cache.newTtlCache<SubscriptionLedger>(256, ttl, clockValue), 0, 0);
}

/** Selects subscription ledgers. Empty fields match all. */
export class SubscriptionLedgerQuery {
  channel: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionLedger): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionLedger[]): SubscriptionLedger[] {
    const matched = collections.filter(items, (candidate: SubscriptionLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionLedgers(store: SubscriptionLedgerStore, query: SubscriptionLedgerQuery): SubscriptionLedger[] {
  return query.apply(store.list());
}
