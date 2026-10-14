import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalTicketViewLedger } from "./regional-ticket-view-ledger.js";

/** Keeps regional ticket view ledgers by code. */
export interface RegionalTicketViewLedgerStore {
  find(code: string): RegionalTicketViewLedger | undefined;
  save(item: RegionalTicketViewLedger): void;
  remove(code: string): boolean;
  list(): RegionalTicketViewLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalTicketViewLedgerStore implements RegionalTicketViewLedgerStore {
  items: Map<string, RegionalTicketViewLedger>;
  order: string[];

  constructor(items: Map<string, RegionalTicketViewLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalTicketViewLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalTicketViewLedger): void {
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

  list(): RegionalTicketViewLedger[] {
    const out: RegionalTicketViewLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalTicketViewLedgerStore(): RegionalTicketViewLedgerStore {
  return new MemoryRegionalTicketViewLedgerStore(new Map<string, RegionalTicketViewLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalTicketViewLedgerStore implements RegionalTicketViewLedgerStore {
  inner: RegionalTicketViewLedgerStore;
  cache: cache.TtlCache<RegionalTicketViewLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalTicketViewLedgerStore,
    cacheValue: cache.TtlCache<RegionalTicketViewLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalTicketViewLedger | undefined {
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

  save(item: RegionalTicketViewLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalTicketViewLedger[] {
    return this.inner.list();
  }
}

export function newCachedRegionalTicketViewLedgerStore(inner: RegionalTicketViewLedgerStore, ttl: number, clockValue: clock.Clock): RegionalTicketViewLedgerStore {
  return new CachedRegionalTicketViewLedgerStore(
    inner,
    cache.newTtlCache<RegionalTicketViewLedger>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional ticket view ledgers. Empty fields match all. */
export class RegionalTicketViewLedgerQuery {
  unit: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minWeight: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalTicketViewLedger): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalTicketViewLedger[]): RegionalTicketViewLedger[] {
    const matched = collections.filter(items, (candidate: RegionalTicketViewLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalTicketViewLedgers(store: RegionalTicketViewLedgerStore, query: RegionalTicketViewLedgerQuery): RegionalTicketViewLedger[] {
  return query.apply(store.list());
}
