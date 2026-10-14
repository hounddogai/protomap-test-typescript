import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PayoutBundle } from "./payout-bundle.js";

/** Keeps payout bundles by code. */
export interface PayoutBundleStore {
  find(code: string): PayoutBundle | undefined;
  save(item: PayoutBundle): void;
  remove(code: string): boolean;
  list(): PayoutBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPayoutBundleStore implements PayoutBundleStore {
  items: Map<string, PayoutBundle>;
  order: string[];

  constructor(items: Map<string, PayoutBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PayoutBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PayoutBundle): void {
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

  list(): PayoutBundle[] {
    const out: PayoutBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPayoutBundleStore(): PayoutBundleStore {
  return new MemoryPayoutBundleStore(new Map<string, PayoutBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPayoutBundleStore implements PayoutBundleStore {
  inner: PayoutBundleStore;
  cache: cache.TtlCache<PayoutBundle>;
  hits: number;
  misses: number;

  constructor(inner: PayoutBundleStore, cacheValue: cache.TtlCache<PayoutBundle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PayoutBundle | undefined {
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

  save(item: PayoutBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PayoutBundle[] {
    return this.inner.list();
  }
}

export function newCachedPayoutBundleStore(inner: PayoutBundleStore, ttl: number, clockValue: clock.Clock): PayoutBundleStore {
  return new CachedPayoutBundleStore(inner, cache.newTtlCache<PayoutBundle>(1024, ttl, clockValue), 0, 0);
}

/** Selects payout bundles. Empty fields match all. */
export class PayoutBundleQuery {
  channel: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minDiscount: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PayoutBundle): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PayoutBundle[]): PayoutBundle[] {
    const matched = collections.filter(items, (candidate: PayoutBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPayoutBundles(store: PayoutBundleStore, query: PayoutBundleQuery): PayoutBundle[] {
  return query.apply(store.list());
}
