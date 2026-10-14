import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryOptOutLedger } from "./primary-opt-out-ledger.js";

/** Keeps primary opt out ledgers by code. */
export interface PrimaryOptOutLedgerStore {
  find(code: string): PrimaryOptOutLedger | undefined;
  save(item: PrimaryOptOutLedger): void;
  remove(code: string): boolean;
  list(): PrimaryOptOutLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryOptOutLedgerStore implements PrimaryOptOutLedgerStore {
  items: Map<string, PrimaryOptOutLedger>;
  order: string[];

  constructor(items: Map<string, PrimaryOptOutLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryOptOutLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryOptOutLedger): void {
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

  list(): PrimaryOptOutLedger[] {
    const out: PrimaryOptOutLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryOptOutLedgerStore(): PrimaryOptOutLedgerStore {
  return new MemoryPrimaryOptOutLedgerStore(new Map<string, PrimaryOptOutLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryOptOutLedgerStore implements PrimaryOptOutLedgerStore {
  inner: PrimaryOptOutLedgerStore;
  cache: cache.TtlCache<PrimaryOptOutLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryOptOutLedgerStore,
    cacheValue: cache.TtlCache<PrimaryOptOutLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryOptOutLedger | undefined {
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

  save(item: PrimaryOptOutLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryOptOutLedger[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryOptOutLedgerStore(inner: PrimaryOptOutLedgerStore, ttl: number, clockValue: clock.Clock): PrimaryOptOutLedgerStore {
  return new CachedPrimaryOptOutLedgerStore(inner, cache.newTtlCache<PrimaryOptOutLedger>(1024, ttl, clockValue), 0, 0);
}

/** Selects primary opt out ledgers. Empty fields match all. */
export class PrimaryOptOutLedgerQuery {
  segment: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minMargin: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryOptOutLedger): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryOptOutLedger[]): PrimaryOptOutLedger[] {
    const matched = collections.filter(items, (candidate: PrimaryOptOutLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryOptOutLedgers(store: PrimaryOptOutLedgerStore, query: PrimaryOptOutLedgerQuery): PrimaryOptOutLedger[] {
  return query.apply(store.list());
}
