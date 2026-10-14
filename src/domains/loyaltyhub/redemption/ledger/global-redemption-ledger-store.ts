import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalRedemptionLedger } from "./global-redemption-ledger.js";

/** Keeps global redemption ledgers by code. */
export interface GlobalRedemptionLedgerStore {
  find(code: string): GlobalRedemptionLedger | undefined;
  save(item: GlobalRedemptionLedger): void;
  remove(code: string): boolean;
  list(): GlobalRedemptionLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalRedemptionLedgerStore implements GlobalRedemptionLedgerStore {
  items: Map<string, GlobalRedemptionLedger>;
  order: string[];

  constructor(items: Map<string, GlobalRedemptionLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalRedemptionLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalRedemptionLedger): void {
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

  list(): GlobalRedemptionLedger[] {
    const out: GlobalRedemptionLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalRedemptionLedgerStore(): GlobalRedemptionLedgerStore {
  return new MemoryGlobalRedemptionLedgerStore(new Map<string, GlobalRedemptionLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalRedemptionLedgerStore implements GlobalRedemptionLedgerStore {
  inner: GlobalRedemptionLedgerStore;
  cache: cache.TtlCache<GlobalRedemptionLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalRedemptionLedgerStore,
    cacheValue: cache.TtlCache<GlobalRedemptionLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalRedemptionLedger | undefined {
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

  save(item: GlobalRedemptionLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalRedemptionLedger[] {
    return this.inner.list();
  }
}

export function newCachedGlobalRedemptionLedgerStore(inner: GlobalRedemptionLedgerStore, ttl: number, clockValue: clock.Clock): GlobalRedemptionLedgerStore {
  return new CachedGlobalRedemptionLedgerStore(
    inner,
    cache.newTtlCache<GlobalRedemptionLedger>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global redemption ledgers. Empty fields match all. */
export class GlobalRedemptionLedgerQuery {
  channel: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRatio: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalRedemptionLedger): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalRedemptionLedger[]): GlobalRedemptionLedger[] {
    const matched = collections.filter(items, (candidate: GlobalRedemptionLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalRedemptionLedgers(store: GlobalRedemptionLedgerStore, query: GlobalRedemptionLedgerQuery): GlobalRedemptionLedger[] {
  return query.apply(store.list());
}
