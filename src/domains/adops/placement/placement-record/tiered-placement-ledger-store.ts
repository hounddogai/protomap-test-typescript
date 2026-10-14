import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredPlacementLedger } from "./tiered-placement-ledger.js";

/** Keeps tiered placement ledgers by code. */
export interface TieredPlacementLedgerStore {
  find(code: string): TieredPlacementLedger | undefined;
  save(item: TieredPlacementLedger): void;
  remove(code: string): boolean;
  list(): TieredPlacementLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredPlacementLedgerStore implements TieredPlacementLedgerStore {
  items: Map<string, TieredPlacementLedger>;
  order: string[];

  constructor(items: Map<string, TieredPlacementLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredPlacementLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredPlacementLedger): void {
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

  list(): TieredPlacementLedger[] {
    const out: TieredPlacementLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredPlacementLedgerStore(): TieredPlacementLedgerStore {
  return new MemoryTieredPlacementLedgerStore(new Map<string, TieredPlacementLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredPlacementLedgerStore implements TieredPlacementLedgerStore {
  inner: TieredPlacementLedgerStore;
  cache: cache.TtlCache<TieredPlacementLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredPlacementLedgerStore,
    cacheValue: cache.TtlCache<TieredPlacementLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredPlacementLedger | undefined {
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

  save(item: TieredPlacementLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredPlacementLedger[] {
    return this.inner.list();
  }
}

export function newCachedTieredPlacementLedgerStore(inner: TieredPlacementLedgerStore, ttl: number, clockValue: clock.Clock): TieredPlacementLedgerStore {
  return new CachedTieredPlacementLedgerStore(
    inner,
    cache.newTtlCache<TieredPlacementLedger>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered placement ledgers. Empty fields match all. */
export class TieredPlacementLedgerQuery {
  channel: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minPriority: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredPlacementLedger): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredPlacementLedger[]): TieredPlacementLedger[] {
    const matched = collections.filter(items, (candidate: TieredPlacementLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredPlacementLedgers(store: TieredPlacementLedgerStore, query: TieredPlacementLedgerQuery): TieredPlacementLedger[] {
  return query.apply(store.list());
}
