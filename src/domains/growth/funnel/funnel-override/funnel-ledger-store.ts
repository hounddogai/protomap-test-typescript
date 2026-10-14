import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelLedger } from "./funnel-ledger.js";

/** Keeps funnel ledgers by code. */
export interface FunnelLedgerStore {
  find(code: string): FunnelLedger | undefined;
  save(item: FunnelLedger): void;
  remove(code: string): boolean;
  list(): FunnelLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelLedgerStore implements FunnelLedgerStore {
  items: Map<string, FunnelLedger>;
  order: string[];

  constructor(items: Map<string, FunnelLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelLedger): void {
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

  list(): FunnelLedger[] {
    const out: FunnelLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelLedgerStore(): FunnelLedgerStore {
  return new MemoryFunnelLedgerStore(new Map<string, FunnelLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelLedgerStore implements FunnelLedgerStore {
  inner: FunnelLedgerStore;
  cache: cache.TtlCache<FunnelLedger>;
  hits: number;
  misses: number;

  constructor(inner: FunnelLedgerStore, cacheValue: cache.TtlCache<FunnelLedger>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelLedger | undefined {
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

  save(item: FunnelLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelLedger[] {
    return this.inner.list();
  }
}

export function newCachedFunnelLedgerStore(inner: FunnelLedgerStore, ttl: number, clockValue: clock.Clock): FunnelLedgerStore {
  return new CachedFunnelLedgerStore(inner, cache.newTtlCache<FunnelLedger>(256, ttl, clockValue), 0, 0);
}

/** Selects funnel ledgers. Empty fields match all. */
export class FunnelLedgerQuery {
  source: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minAttempts: number, statuses: string[], limit: number) {
    this.source = source;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelLedger): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelLedger[]): FunnelLedger[] {
    const matched = collections.filter(items, (candidate: FunnelLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelLedgers(store: FunnelLedgerStore, query: FunnelLedgerQuery): FunnelLedger[] {
  return query.apply(store.list());
}
