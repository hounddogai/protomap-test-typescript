import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingPlacementLedger } from "./rolling-placement-ledger.js";

/** Keeps rolling placement ledgers by code. */
export interface RollingPlacementLedgerStore {
  find(code: string): RollingPlacementLedger | undefined;
  save(item: RollingPlacementLedger): void;
  remove(code: string): boolean;
  list(): RollingPlacementLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingPlacementLedgerStore implements RollingPlacementLedgerStore {
  items: Map<string, RollingPlacementLedger>;
  order: string[];

  constructor(items: Map<string, RollingPlacementLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingPlacementLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingPlacementLedger): void {
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

  list(): RollingPlacementLedger[] {
    const out: RollingPlacementLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingPlacementLedgerStore(): RollingPlacementLedgerStore {
  return new MemoryRollingPlacementLedgerStore(new Map<string, RollingPlacementLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingPlacementLedgerStore implements RollingPlacementLedgerStore {
  inner: RollingPlacementLedgerStore;
  cache: cache.TtlCache<RollingPlacementLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingPlacementLedgerStore,
    cacheValue: cache.TtlCache<RollingPlacementLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingPlacementLedger | undefined {
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

  save(item: RollingPlacementLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingPlacementLedger[] {
    return this.inner.list();
  }
}

export function newCachedRollingPlacementLedgerStore(inner: RollingPlacementLedgerStore, ttl: number, clockValue: clock.Clock): RollingPlacementLedgerStore {
  return new CachedRollingPlacementLedgerStore(
    inner,
    cache.newTtlCache<RollingPlacementLedger>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling placement ledgers. Empty fields match all. */
export class RollingPlacementLedgerQuery {
  name: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDiscount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingPlacementLedger): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingPlacementLedger[]): RollingPlacementLedger[] {
    const matched = collections.filter(items, (candidate: RollingPlacementLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingPlacementLedgers(store: RollingPlacementLedgerStore, query: RollingPlacementLedgerQuery): RollingPlacementLedger[] {
  return query.apply(store.list());
}
