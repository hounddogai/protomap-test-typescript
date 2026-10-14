import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackModelLedger } from "./fallback-model-ledger.js";

/** Keeps fallback model ledgers by code. */
export interface FallbackModelLedgerStore {
  find(code: string): FallbackModelLedger | undefined;
  save(item: FallbackModelLedger): void;
  remove(code: string): boolean;
  list(): FallbackModelLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackModelLedgerStore implements FallbackModelLedgerStore {
  items: Map<string, FallbackModelLedger>;
  order: string[];

  constructor(items: Map<string, FallbackModelLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackModelLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackModelLedger): void {
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

  list(): FallbackModelLedger[] {
    const out: FallbackModelLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackModelLedgerStore(): FallbackModelLedgerStore {
  return new MemoryFallbackModelLedgerStore(new Map<string, FallbackModelLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackModelLedgerStore implements FallbackModelLedgerStore {
  inner: FallbackModelLedgerStore;
  cache: cache.TtlCache<FallbackModelLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackModelLedgerStore,
    cacheValue: cache.TtlCache<FallbackModelLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackModelLedger | undefined {
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

  save(item: FallbackModelLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackModelLedger[] {
    return this.inner.list();
  }
}

export function newCachedFallbackModelLedgerStore(inner: FallbackModelLedgerStore, ttl: number, clockValue: clock.Clock): FallbackModelLedgerStore {
  return new CachedFallbackModelLedgerStore(inner, cache.newTtlCache<FallbackModelLedger>(512, ttl, clockValue), 0, 0);
}

/** Selects fallback model ledgers. Empty fields match all. */
export class FallbackModelLedgerQuery {
  unit: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minFloorValue: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackModelLedger): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackModelLedger[]): FallbackModelLedger[] {
    const matched = collections.filter(items, (candidate: FallbackModelLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackModelLedgers(store: FallbackModelLedgerStore, query: FallbackModelLedgerQuery): FallbackModelLedger[] {
  return query.apply(store.list());
}
