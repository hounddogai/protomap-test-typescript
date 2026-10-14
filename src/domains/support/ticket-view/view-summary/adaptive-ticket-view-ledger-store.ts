import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveTicketViewLedger } from "./adaptive-ticket-view-ledger.js";

/** Keeps adaptive ticket view ledgers by code. */
export interface AdaptiveTicketViewLedgerStore {
  find(code: string): AdaptiveTicketViewLedger | undefined;
  save(item: AdaptiveTicketViewLedger): void;
  remove(code: string): boolean;
  list(): AdaptiveTicketViewLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveTicketViewLedgerStore implements AdaptiveTicketViewLedgerStore {
  items: Map<string, AdaptiveTicketViewLedger>;
  order: string[];

  constructor(items: Map<string, AdaptiveTicketViewLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveTicketViewLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveTicketViewLedger): void {
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

  list(): AdaptiveTicketViewLedger[] {
    const out: AdaptiveTicketViewLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveTicketViewLedgerStore(): AdaptiveTicketViewLedgerStore {
  return new MemoryAdaptiveTicketViewLedgerStore(new Map<string, AdaptiveTicketViewLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveTicketViewLedgerStore implements AdaptiveTicketViewLedgerStore {
  inner: AdaptiveTicketViewLedgerStore;
  cache: cache.TtlCache<AdaptiveTicketViewLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveTicketViewLedgerStore,
    cacheValue: cache.TtlCache<AdaptiveTicketViewLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveTicketViewLedger | undefined {
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

  save(item: AdaptiveTicketViewLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveTicketViewLedger[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveTicketViewLedgerStore(inner: AdaptiveTicketViewLedgerStore, ttl: number, clockValue: clock.Clock): AdaptiveTicketViewLedgerStore {
  return new CachedAdaptiveTicketViewLedgerStore(
    inner,
    cache.newTtlCache<AdaptiveTicketViewLedger>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive ticket view ledgers. Empty fields match all. */
export class AdaptiveTicketViewLedgerQuery {
  unit: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveTicketViewLedger): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveTicketViewLedger[]): AdaptiveTicketViewLedger[] {
    const matched = collections.filter(items, (candidate: AdaptiveTicketViewLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveTicketViewLedgers(store: AdaptiveTicketViewLedgerStore, query: AdaptiveTicketViewLedgerQuery): AdaptiveTicketViewLedger[] {
  return query.apply(store.list());
}
