import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PayoutLedger } from "./payout-ledger.js";

/** Keeps payout ledgers by code. */
export interface PayoutLedgerStore {
  find(code: string): PayoutLedger | undefined;
  save(item: PayoutLedger): void;
  remove(code: string): boolean;
  list(): PayoutLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPayoutLedgerStore implements PayoutLedgerStore {
  items: Map<string, PayoutLedger>;
  order: string[];

  constructor(items: Map<string, PayoutLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PayoutLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PayoutLedger): void {
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

  list(): PayoutLedger[] {
    const out: PayoutLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPayoutLedgerStore(): PayoutLedgerStore {
  return new MemoryPayoutLedgerStore(new Map<string, PayoutLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPayoutLedgerStore implements PayoutLedgerStore {
  inner: PayoutLedgerStore;
  cache: cache.TtlCache<PayoutLedger>;
  hits: number;
  misses: number;

  constructor(inner: PayoutLedgerStore, cacheValue: cache.TtlCache<PayoutLedger>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PayoutLedger | undefined {
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

  save(item: PayoutLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PayoutLedger[] {
    return this.inner.list();
  }
}

export function newCachedPayoutLedgerStore(inner: PayoutLedgerStore, ttl: number, clockValue: clock.Clock): PayoutLedgerStore {
  return new CachedPayoutLedgerStore(inner, cache.newTtlCache<PayoutLedger>(512, ttl, clockValue), 0, 0);
}

/** Selects payout ledgers. Empty fields match all. */
export class PayoutLedgerQuery {
  locale: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minScore: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PayoutLedger): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PayoutLedger[]): PayoutLedger[] {
    const matched = collections.filter(items, (candidate: PayoutLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPayoutLedgers(store: PayoutLedgerStore, query: PayoutLedgerQuery): PayoutLedger[] {
  return query.apply(store.list());
}
