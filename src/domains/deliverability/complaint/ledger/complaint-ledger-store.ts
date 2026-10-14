import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ComplaintLedger } from "./complaint-ledger.js";

/** Keeps complaint ledgers by code. */
export interface ComplaintLedgerStore {
  find(code: string): ComplaintLedger | undefined;
  save(item: ComplaintLedger): void;
  remove(code: string): boolean;
  list(): ComplaintLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryComplaintLedgerStore implements ComplaintLedgerStore {
  items: Map<string, ComplaintLedger>;
  order: string[];

  constructor(items: Map<string, ComplaintLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ComplaintLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ComplaintLedger): void {
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

  list(): ComplaintLedger[] {
    const out: ComplaintLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryComplaintLedgerStore(): ComplaintLedgerStore {
  return new MemoryComplaintLedgerStore(new Map<string, ComplaintLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedComplaintLedgerStore implements ComplaintLedgerStore {
  inner: ComplaintLedgerStore;
  cache: cache.TtlCache<ComplaintLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: ComplaintLedgerStore,
    cacheValue: cache.TtlCache<ComplaintLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ComplaintLedger | undefined {
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

  save(item: ComplaintLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ComplaintLedger[] {
    return this.inner.list();
  }
}

export function newCachedComplaintLedgerStore(inner: ComplaintLedgerStore, ttl: number, clockValue: clock.Clock): ComplaintLedgerStore {
  return new CachedComplaintLedgerStore(inner, cache.newTtlCache<ComplaintLedger>(512, ttl, clockValue), 0, 0);
}

/** Selects complaint ledgers. Empty fields match all. */
export class ComplaintLedgerQuery {
  locale: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minVersion: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ComplaintLedger): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ComplaintLedger[]): ComplaintLedger[] {
    const matched = collections.filter(items, (candidate: ComplaintLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findComplaintLedgers(store: ComplaintLedgerStore, query: ComplaintLedgerQuery): ComplaintLedger[] {
  return query.apply(store.list());
}
