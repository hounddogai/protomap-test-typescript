import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyPayoutLedger } from "./legacy-payout-ledger.js";

/** Keeps legacy payout ledgers by code. */
export interface LegacyPayoutLedgerStore {
  find(code: string): LegacyPayoutLedger | undefined;
  save(item: LegacyPayoutLedger): void;
  remove(code: string): boolean;
  list(): LegacyPayoutLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyPayoutLedgerStore implements LegacyPayoutLedgerStore {
  items: Map<string, LegacyPayoutLedger>;
  order: string[];

  constructor(items: Map<string, LegacyPayoutLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyPayoutLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyPayoutLedger): void {
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

  list(): LegacyPayoutLedger[] {
    const out: LegacyPayoutLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyPayoutLedgerStore(): LegacyPayoutLedgerStore {
  return new MemoryLegacyPayoutLedgerStore(new Map<string, LegacyPayoutLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyPayoutLedgerStore implements LegacyPayoutLedgerStore {
  inner: LegacyPayoutLedgerStore;
  cache: cache.TtlCache<LegacyPayoutLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyPayoutLedgerStore,
    cacheValue: cache.TtlCache<LegacyPayoutLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyPayoutLedger | undefined {
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

  save(item: LegacyPayoutLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyPayoutLedger[] {
    return this.inner.list();
  }
}

export function newCachedLegacyPayoutLedgerStore(inner: LegacyPayoutLedgerStore, ttl: number, clockValue: clock.Clock): LegacyPayoutLedgerStore {
  return new CachedLegacyPayoutLedgerStore(inner, cache.newTtlCache<LegacyPayoutLedger>(256, ttl, clockValue), 0, 0);
}

/** Selects legacy payout ledgers. Empty fields match all. */
export class LegacyPayoutLedgerQuery {
  channel: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCost: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyPayoutLedger): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyPayoutLedger[]): LegacyPayoutLedger[] {
    const matched = collections.filter(items, (candidate: LegacyPayoutLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyPayoutLedgers(store: LegacyPayoutLedgerStore, query: LegacyPayoutLedgerQuery): LegacyPayoutLedger[] {
  return query.apply(store.list());
}
