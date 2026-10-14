import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalCreativeLedger } from "./seasonal-creative-ledger.js";

/** Keeps seasonal creative ledgers by code. */
export interface SeasonalCreativeLedgerStore {
  find(code: string): SeasonalCreativeLedger | undefined;
  save(item: SeasonalCreativeLedger): void;
  remove(code: string): boolean;
  list(): SeasonalCreativeLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalCreativeLedgerStore implements SeasonalCreativeLedgerStore {
  items: Map<string, SeasonalCreativeLedger>;
  order: string[];

  constructor(items: Map<string, SeasonalCreativeLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalCreativeLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalCreativeLedger): void {
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

  list(): SeasonalCreativeLedger[] {
    const out: SeasonalCreativeLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalCreativeLedgerStore(): SeasonalCreativeLedgerStore {
  return new MemorySeasonalCreativeLedgerStore(new Map<string, SeasonalCreativeLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalCreativeLedgerStore implements SeasonalCreativeLedgerStore {
  inner: SeasonalCreativeLedgerStore;
  cache: cache.TtlCache<SeasonalCreativeLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalCreativeLedgerStore,
    cacheValue: cache.TtlCache<SeasonalCreativeLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalCreativeLedger | undefined {
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

  save(item: SeasonalCreativeLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalCreativeLedger[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalCreativeLedgerStore(inner: SeasonalCreativeLedgerStore, ttl: number, clockValue: clock.Clock): SeasonalCreativeLedgerStore {
  return new CachedSeasonalCreativeLedgerStore(
    inner,
    cache.newTtlCache<SeasonalCreativeLedger>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal creative ledgers. Empty fields match all. */
export class SeasonalCreativeLedgerQuery {
  country: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minGraceDays: number, statuses: string[], limit: number) {
    this.country = country;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalCreativeLedger): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalCreativeLedger[]): SeasonalCreativeLedger[] {
    const matched = collections.filter(items, (candidate: SeasonalCreativeLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalCreativeLedgers(store: SeasonalCreativeLedgerStore, query: SeasonalCreativeLedgerQuery): SeasonalCreativeLedger[] {
  return query.apply(store.list());
}
