import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientPayoutLedger } from "./lenient-payout-ledger.js";

/** Keeps lenient payout ledgers by code. */
export interface LenientPayoutLedgerStore {
  find(code: string): LenientPayoutLedger | undefined;
  save(item: LenientPayoutLedger): void;
  remove(code: string): boolean;
  list(): LenientPayoutLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientPayoutLedgerStore implements LenientPayoutLedgerStore {
  items: Map<string, LenientPayoutLedger>;
  order: string[];

  constructor(items: Map<string, LenientPayoutLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientPayoutLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientPayoutLedger): void {
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

  list(): LenientPayoutLedger[] {
    const out: LenientPayoutLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientPayoutLedgerStore(): LenientPayoutLedgerStore {
  return new MemoryLenientPayoutLedgerStore(new Map<string, LenientPayoutLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientPayoutLedgerStore implements LenientPayoutLedgerStore {
  inner: LenientPayoutLedgerStore;
  cache: cache.TtlCache<LenientPayoutLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientPayoutLedgerStore,
    cacheValue: cache.TtlCache<LenientPayoutLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientPayoutLedger | undefined {
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

  save(item: LenientPayoutLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientPayoutLedger[] {
    return this.inner.list();
  }
}

export function newCachedLenientPayoutLedgerStore(inner: LenientPayoutLedgerStore, ttl: number, clockValue: clock.Clock): LenientPayoutLedgerStore {
  return new CachedLenientPayoutLedgerStore(inner, cache.newTtlCache<LenientPayoutLedger>(128, ttl, clockValue), 0, 0);
}

/** Selects lenient payout ledgers. Empty fields match all. */
export class LenientPayoutLedgerQuery {
  title: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCeiling: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientPayoutLedger): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientPayoutLedger[]): LenientPayoutLedger[] {
    const matched = collections.filter(items, (candidate: LenientPayoutLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientPayoutLedgers(store: LenientPayoutLedgerStore, query: LenientPayoutLedgerQuery): LenientPayoutLedger[] {
  return query.apply(store.list());
}
