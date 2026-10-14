import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultCreditLedger } from "./default-credit-ledger.js";

/** Keeps default credit ledgers by code. */
export interface DefaultCreditLedgerStore {
  find(code: string): DefaultCreditLedger | undefined;
  save(item: DefaultCreditLedger): void;
  remove(code: string): boolean;
  list(): DefaultCreditLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultCreditLedgerStore implements DefaultCreditLedgerStore {
  items: Map<string, DefaultCreditLedger>;
  order: string[];

  constructor(items: Map<string, DefaultCreditLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultCreditLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultCreditLedger): void {
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

  list(): DefaultCreditLedger[] {
    const out: DefaultCreditLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultCreditLedgerStore(): DefaultCreditLedgerStore {
  return new MemoryDefaultCreditLedgerStore(new Map<string, DefaultCreditLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultCreditLedgerStore implements DefaultCreditLedgerStore {
  inner: DefaultCreditLedgerStore;
  cache: cache.TtlCache<DefaultCreditLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultCreditLedgerStore,
    cacheValue: cache.TtlCache<DefaultCreditLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultCreditLedger | undefined {
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

  save(item: DefaultCreditLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultCreditLedger[] {
    return this.inner.list();
  }
}

export function newCachedDefaultCreditLedgerStore(inner: DefaultCreditLedgerStore, ttl: number, clockValue: clock.Clock): DefaultCreditLedgerStore {
  return new CachedDefaultCreditLedgerStore(inner, cache.newTtlCache<DefaultCreditLedger>(64, ttl, clockValue), 0, 0);
}

/** Selects default credit ledgers. Empty fields match all. */
export class DefaultCreditLedgerQuery {
  segment: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minBatchSize: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultCreditLedger): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultCreditLedger[]): DefaultCreditLedger[] {
    const matched = collections.filter(items, (candidate: DefaultCreditLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultCreditLedgers(store: DefaultCreditLedgerStore, query: DefaultCreditLedgerQuery): DefaultCreditLedger[] {
  return query.apply(store.list());
}
