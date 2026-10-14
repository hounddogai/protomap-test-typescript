import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditLedger } from "./credit-ledger.js";

/** Keeps credit ledgers by code. */
export interface CreditLedgerStore {
  find(code: string): CreditLedger | undefined;
  save(item: CreditLedger): void;
  remove(code: string): boolean;
  list(): CreditLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditLedgerStore implements CreditLedgerStore {
  items: Map<string, CreditLedger>;
  order: string[];

  constructor(items: Map<string, CreditLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditLedger): void {
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

  list(): CreditLedger[] {
    const out: CreditLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditLedgerStore(): CreditLedgerStore {
  return new MemoryCreditLedgerStore(new Map<string, CreditLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditLedgerStore implements CreditLedgerStore {
  inner: CreditLedgerStore;
  cache: cache.TtlCache<CreditLedger>;
  hits: number;
  misses: number;

  constructor(inner: CreditLedgerStore, cacheValue: cache.TtlCache<CreditLedger>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditLedger | undefined {
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

  save(item: CreditLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditLedger[] {
    return this.inner.list();
  }
}

export function newCachedCreditLedgerStore(inner: CreditLedgerStore, ttl: number, clockValue: clock.Clock): CreditLedgerStore {
  return new CachedCreditLedgerStore(inner, cache.newTtlCache<CreditLedger>(256, ttl, clockValue), 0, 0);
}

/** Selects credit ledgers. Empty fields match all. */
export class CreditLedgerQuery {
  locale: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minQuantity: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditLedger): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditLedger[]): CreditLedger[] {
    const matched = collections.filter(items, (candidate: CreditLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditLedgers(store: CreditLedgerStore, query: CreditLedgerQuery): CreditLedger[] {
  return query.apply(store.list());
}
