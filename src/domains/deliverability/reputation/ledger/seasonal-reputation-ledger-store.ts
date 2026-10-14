import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalReputationLedger } from "./seasonal-reputation-ledger.js";

/** Keeps seasonal reputation ledgers by code. */
export interface SeasonalReputationLedgerStore {
  find(code: string): SeasonalReputationLedger | undefined;
  save(item: SeasonalReputationLedger): void;
  remove(code: string): boolean;
  list(): SeasonalReputationLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalReputationLedgerStore implements SeasonalReputationLedgerStore {
  items: Map<string, SeasonalReputationLedger>;
  order: string[];

  constructor(items: Map<string, SeasonalReputationLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalReputationLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalReputationLedger): void {
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

  list(): SeasonalReputationLedger[] {
    const out: SeasonalReputationLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalReputationLedgerStore(): SeasonalReputationLedgerStore {
  return new MemorySeasonalReputationLedgerStore(new Map<string, SeasonalReputationLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalReputationLedgerStore implements SeasonalReputationLedgerStore {
  inner: SeasonalReputationLedgerStore;
  cache: cache.TtlCache<SeasonalReputationLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalReputationLedgerStore,
    cacheValue: cache.TtlCache<SeasonalReputationLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalReputationLedger | undefined {
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

  save(item: SeasonalReputationLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalReputationLedger[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalReputationLedgerStore(inner: SeasonalReputationLedgerStore, ttl: number, clockValue: clock.Clock): SeasonalReputationLedgerStore {
  return new CachedSeasonalReputationLedgerStore(
    inner,
    cache.newTtlCache<SeasonalReputationLedger>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal reputation ledgers. Empty fields match all. */
export class SeasonalReputationLedgerQuery {
  region: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minGraceDays: number, statuses: string[], limit: number) {
    this.region = region;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalReputationLedger): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalReputationLedger[]): SeasonalReputationLedger[] {
    const matched = collections.filter(items, (candidate: SeasonalReputationLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalReputationLedgers(store: SeasonalReputationLedgerStore, query: SeasonalReputationLedgerQuery): SeasonalReputationLedger[] {
  return query.apply(store.list());
}
