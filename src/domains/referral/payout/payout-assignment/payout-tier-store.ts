import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PayoutTier } from "./payout-tier.js";

/** Keeps payout tiers by code. */
export interface PayoutTierStore {
  find(code: string): PayoutTier | undefined;
  save(item: PayoutTier): void;
  remove(code: string): boolean;
  list(): PayoutTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPayoutTierStore implements PayoutTierStore {
  items: Map<string, PayoutTier>;
  order: string[];

  constructor(items: Map<string, PayoutTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PayoutTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PayoutTier): void {
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

  list(): PayoutTier[] {
    const out: PayoutTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPayoutTierStore(): PayoutTierStore {
  return new MemoryPayoutTierStore(new Map<string, PayoutTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPayoutTierStore implements PayoutTierStore {
  inner: PayoutTierStore;
  cache: cache.TtlCache<PayoutTier>;
  hits: number;
  misses: number;

  constructor(inner: PayoutTierStore, cacheValue: cache.TtlCache<PayoutTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PayoutTier | undefined {
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

  save(item: PayoutTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PayoutTier[] {
    return this.inner.list();
  }
}

export function newCachedPayoutTierStore(inner: PayoutTierStore, ttl: number, clockValue: clock.Clock): PayoutTierStore {
  return new CachedPayoutTierStore(inner, cache.newTtlCache<PayoutTier>(512, ttl, clockValue), 0, 0);
}

/** Selects payout tiers. Empty fields match all. */
export class PayoutTierQuery {
  locale: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCapacity: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PayoutTier): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PayoutTier[]): PayoutTier[] {
    const matched = collections.filter(items, (candidate: PayoutTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPayoutTiers(store: PayoutTierStore, query: PayoutTierQuery): PayoutTier[] {
  return query.apply(store.list());
}
