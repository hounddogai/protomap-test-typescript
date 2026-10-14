import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalJourneyLedger } from "./global-journey-ledger.js";

/** Keeps global journey ledgers by code. */
export interface GlobalJourneyLedgerStore {
  find(code: string): GlobalJourneyLedger | undefined;
  save(item: GlobalJourneyLedger): void;
  remove(code: string): boolean;
  list(): GlobalJourneyLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalJourneyLedgerStore implements GlobalJourneyLedgerStore {
  items: Map<string, GlobalJourneyLedger>;
  order: string[];

  constructor(items: Map<string, GlobalJourneyLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalJourneyLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalJourneyLedger): void {
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

  list(): GlobalJourneyLedger[] {
    const out: GlobalJourneyLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalJourneyLedgerStore(): GlobalJourneyLedgerStore {
  return new MemoryGlobalJourneyLedgerStore(new Map<string, GlobalJourneyLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalJourneyLedgerStore implements GlobalJourneyLedgerStore {
  inner: GlobalJourneyLedgerStore;
  cache: cache.TtlCache<GlobalJourneyLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalJourneyLedgerStore,
    cacheValue: cache.TtlCache<GlobalJourneyLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalJourneyLedger | undefined {
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

  save(item: GlobalJourneyLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalJourneyLedger[] {
    return this.inner.list();
  }
}

export function newCachedGlobalJourneyLedgerStore(inner: GlobalJourneyLedgerStore, ttl: number, clockValue: clock.Clock): GlobalJourneyLedgerStore {
  return new CachedGlobalJourneyLedgerStore(inner, cache.newTtlCache<GlobalJourneyLedger>(64, ttl, clockValue), 0, 0);
}

/** Selects global journey ledgers. Empty fields match all. */
export class GlobalJourneyLedgerQuery {
  label: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSendAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalJourneyLedger): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalJourneyLedger[]): GlobalJourneyLedger[] {
    const matched = collections.filter(items, (candidate: GlobalJourneyLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalJourneyLedgers(store: GlobalJourneyLedgerStore, query: GlobalJourneyLedgerQuery): GlobalJourneyLedger[] {
  return query.apply(store.list());
}
