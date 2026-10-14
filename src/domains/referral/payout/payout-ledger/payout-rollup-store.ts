import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PayoutRollup } from "./payout-rollup.js";

/** Keeps payout rollups by code. */
export interface PayoutRollupStore {
  find(code: string): PayoutRollup | undefined;
  save(item: PayoutRollup): void;
  remove(code: string): boolean;
  list(): PayoutRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPayoutRollupStore implements PayoutRollupStore {
  items: Map<string, PayoutRollup>;
  order: string[];

  constructor(items: Map<string, PayoutRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PayoutRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PayoutRollup): void {
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

  list(): PayoutRollup[] {
    const out: PayoutRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPayoutRollupStore(): PayoutRollupStore {
  return new MemoryPayoutRollupStore(new Map<string, PayoutRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPayoutRollupStore implements PayoutRollupStore {
  inner: PayoutRollupStore;
  cache: cache.TtlCache<PayoutRollup>;
  hits: number;
  misses: number;

  constructor(inner: PayoutRollupStore, cacheValue: cache.TtlCache<PayoutRollup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PayoutRollup | undefined {
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

  save(item: PayoutRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PayoutRollup[] {
    return this.inner.list();
  }
}

export function newCachedPayoutRollupStore(inner: PayoutRollupStore, ttl: number, clockValue: clock.Clock): PayoutRollupStore {
  return new CachedPayoutRollupStore(inner, cache.newTtlCache<PayoutRollup>(1024, ttl, clockValue), 0, 0);
}

/** Selects payout rollups. Empty fields match all. */
export class PayoutRollupQuery {
  source: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRate: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PayoutRollup): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PayoutRollup[]): PayoutRollup[] {
    const matched = collections.filter(items, (candidate: PayoutRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPayoutRollups(store: PayoutRollupStore, query: PayoutRollupQuery): PayoutRollup[] {
  return query.apply(store.list());
}
