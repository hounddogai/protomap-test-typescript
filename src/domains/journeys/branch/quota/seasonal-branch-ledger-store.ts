import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalBranchLedger } from "./seasonal-branch-ledger.js";

/** Keeps seasonal branch ledgers by code. */
export interface SeasonalBranchLedgerStore {
  find(code: string): SeasonalBranchLedger | undefined;
  save(item: SeasonalBranchLedger): void;
  remove(code: string): boolean;
  list(): SeasonalBranchLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalBranchLedgerStore implements SeasonalBranchLedgerStore {
  items: Map<string, SeasonalBranchLedger>;
  order: string[];

  constructor(items: Map<string, SeasonalBranchLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalBranchLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalBranchLedger): void {
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

  list(): SeasonalBranchLedger[] {
    const out: SeasonalBranchLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalBranchLedgerStore(): SeasonalBranchLedgerStore {
  return new MemorySeasonalBranchLedgerStore(new Map<string, SeasonalBranchLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalBranchLedgerStore implements SeasonalBranchLedgerStore {
  inner: SeasonalBranchLedgerStore;
  cache: cache.TtlCache<SeasonalBranchLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalBranchLedgerStore,
    cacheValue: cache.TtlCache<SeasonalBranchLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalBranchLedger | undefined {
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

  save(item: SeasonalBranchLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalBranchLedger[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalBranchLedgerStore(inner: SeasonalBranchLedgerStore, ttl: number, clockValue: clock.Clock): SeasonalBranchLedgerStore {
  return new CachedSeasonalBranchLedgerStore(inner, cache.newTtlCache<SeasonalBranchLedger>(64, ttl, clockValue), 0, 0);
}

/** Selects seasonal branch ledgers. Empty fields match all. */
export class SeasonalBranchLedgerQuery {
  category: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minClicks: number, statuses: string[], limit: number) {
    this.category = category;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalBranchLedger): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalBranchLedger[]): SeasonalBranchLedger[] {
    const matched = collections.filter(items, (candidate: SeasonalBranchLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalBranchLedgers(store: SeasonalBranchLedgerStore, query: SeasonalBranchLedgerQuery): SeasonalBranchLedger[] {
  return query.apply(store.list());
}
