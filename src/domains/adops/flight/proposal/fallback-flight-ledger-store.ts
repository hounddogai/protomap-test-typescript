import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackFlightLedger } from "./fallback-flight-ledger.js";

/** Keeps fallback flight ledgers by code. */
export interface FallbackFlightLedgerStore {
  find(code: string): FallbackFlightLedger | undefined;
  save(item: FallbackFlightLedger): void;
  remove(code: string): boolean;
  list(): FallbackFlightLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackFlightLedgerStore implements FallbackFlightLedgerStore {
  items: Map<string, FallbackFlightLedger>;
  order: string[];

  constructor(items: Map<string, FallbackFlightLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackFlightLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackFlightLedger): void {
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

  list(): FallbackFlightLedger[] {
    const out: FallbackFlightLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackFlightLedgerStore(): FallbackFlightLedgerStore {
  return new MemoryFallbackFlightLedgerStore(new Map<string, FallbackFlightLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackFlightLedgerStore implements FallbackFlightLedgerStore {
  inner: FallbackFlightLedgerStore;
  cache: cache.TtlCache<FallbackFlightLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackFlightLedgerStore,
    cacheValue: cache.TtlCache<FallbackFlightLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackFlightLedger | undefined {
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

  save(item: FallbackFlightLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackFlightLedger[] {
    return this.inner.list();
  }
}

export function newCachedFallbackFlightLedgerStore(inner: FallbackFlightLedgerStore, ttl: number, clockValue: clock.Clock): FallbackFlightLedgerStore {
  return new CachedFallbackFlightLedgerStore(
    inner,
    cache.newTtlCache<FallbackFlightLedger>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback flight ledgers. Empty fields match all. */
export class FallbackFlightLedgerQuery {
  title: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minLimit: number, statuses: string[], limit: number) {
    this.title = title;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackFlightLedger): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackFlightLedger[]): FallbackFlightLedger[] {
    const matched = collections.filter(items, (candidate: FallbackFlightLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackFlightLedgers(store: FallbackFlightLedgerStore, query: FallbackFlightLedgerQuery): FallbackFlightLedger[] {
  return query.apply(store.list());
}
