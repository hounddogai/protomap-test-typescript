import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalPayoutLedger } from "./seasonal-payout-ledger.js";

/** Keeps seasonal payout ledgers by code. */
export interface SeasonalPayoutLedgerStore {
  find(code: string): SeasonalPayoutLedger | undefined;
  save(item: SeasonalPayoutLedger): void;
  remove(code: string): boolean;
  list(): SeasonalPayoutLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalPayoutLedgerStore implements SeasonalPayoutLedgerStore {
  items: Map<string, SeasonalPayoutLedger>;
  order: string[];

  constructor(items: Map<string, SeasonalPayoutLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalPayoutLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalPayoutLedger): void {
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

  list(): SeasonalPayoutLedger[] {
    const out: SeasonalPayoutLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalPayoutLedgerStore(): SeasonalPayoutLedgerStore {
  return new MemorySeasonalPayoutLedgerStore(new Map<string, SeasonalPayoutLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalPayoutLedgerStore implements SeasonalPayoutLedgerStore {
  inner: SeasonalPayoutLedgerStore;
  cache: cache.TtlCache<SeasonalPayoutLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalPayoutLedgerStore,
    cacheValue: cache.TtlCache<SeasonalPayoutLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalPayoutLedger | undefined {
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

  save(item: SeasonalPayoutLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalPayoutLedger[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalPayoutLedgerStore(inner: SeasonalPayoutLedgerStore, ttl: number, clockValue: clock.Clock): SeasonalPayoutLedgerStore {
  return new CachedSeasonalPayoutLedgerStore(
    inner,
    cache.newTtlCache<SeasonalPayoutLedger>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal payout ledgers. Empty fields match all. */
export class SeasonalPayoutLedgerQuery {
  channel: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minAttempts: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalPayoutLedger): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalPayoutLedger[]): SeasonalPayoutLedger[] {
    const matched = collections.filter(items, (candidate: SeasonalPayoutLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalPayoutLedgers(store: SeasonalPayoutLedgerStore, query: SeasonalPayoutLedgerQuery): SeasonalPayoutLedger[] {
  return query.apply(store.list());
}
