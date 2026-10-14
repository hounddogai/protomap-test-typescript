import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalPaywallLedger } from "./seasonal-paywall-ledger.js";

/** Keeps seasonal paywall ledgers by code. */
export interface SeasonalPaywallLedgerStore {
  find(code: string): SeasonalPaywallLedger | undefined;
  save(item: SeasonalPaywallLedger): void;
  remove(code: string): boolean;
  list(): SeasonalPaywallLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalPaywallLedgerStore implements SeasonalPaywallLedgerStore {
  items: Map<string, SeasonalPaywallLedger>;
  order: string[];

  constructor(items: Map<string, SeasonalPaywallLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalPaywallLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalPaywallLedger): void {
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

  list(): SeasonalPaywallLedger[] {
    const out: SeasonalPaywallLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalPaywallLedgerStore(): SeasonalPaywallLedgerStore {
  return new MemorySeasonalPaywallLedgerStore(new Map<string, SeasonalPaywallLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalPaywallLedgerStore implements SeasonalPaywallLedgerStore {
  inner: SeasonalPaywallLedgerStore;
  cache: cache.TtlCache<SeasonalPaywallLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalPaywallLedgerStore,
    cacheValue: cache.TtlCache<SeasonalPaywallLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalPaywallLedger | undefined {
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

  save(item: SeasonalPaywallLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalPaywallLedger[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalPaywallLedgerStore(inner: SeasonalPaywallLedgerStore, ttl: number, clockValue: clock.Clock): SeasonalPaywallLedgerStore {
  return new CachedSeasonalPaywallLedgerStore(
    inner,
    cache.newTtlCache<SeasonalPaywallLedger>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal paywall ledgers. Empty fields match all. */
export class SeasonalPaywallLedgerQuery {
  country: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minRevision: number, statuses: string[], limit: number) {
    this.country = country;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalPaywallLedger): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalPaywallLedger[]): SeasonalPaywallLedger[] {
    const matched = collections.filter(items, (candidate: SeasonalPaywallLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalPaywallLedgers(store: SeasonalPaywallLedgerStore, query: SeasonalPaywallLedgerQuery): SeasonalPaywallLedger[] {
  return query.apply(store.list());
}
