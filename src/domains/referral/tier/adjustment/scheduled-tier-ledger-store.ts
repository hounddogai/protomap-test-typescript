import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledTierLedger } from "./scheduled-tier-ledger.js";

/** Keeps scheduled tier ledgers by code. */
export interface ScheduledTierLedgerStore {
  find(code: string): ScheduledTierLedger | undefined;
  save(item: ScheduledTierLedger): void;
  remove(code: string): boolean;
  list(): ScheduledTierLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledTierLedgerStore implements ScheduledTierLedgerStore {
  items: Map<string, ScheduledTierLedger>;
  order: string[];

  constructor(items: Map<string, ScheduledTierLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledTierLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledTierLedger): void {
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

  list(): ScheduledTierLedger[] {
    const out: ScheduledTierLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledTierLedgerStore(): ScheduledTierLedgerStore {
  return new MemoryScheduledTierLedgerStore(new Map<string, ScheduledTierLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledTierLedgerStore implements ScheduledTierLedgerStore {
  inner: ScheduledTierLedgerStore;
  cache: cache.TtlCache<ScheduledTierLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledTierLedgerStore,
    cacheValue: cache.TtlCache<ScheduledTierLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledTierLedger | undefined {
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

  save(item: ScheduledTierLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledTierLedger[] {
    return this.inner.list();
  }
}

export function newCachedScheduledTierLedgerStore(inner: ScheduledTierLedgerStore, ttl: number, clockValue: clock.Clock): ScheduledTierLedgerStore {
  return new CachedScheduledTierLedgerStore(inner, cache.newTtlCache<ScheduledTierLedger>(1024, ttl, clockValue), 0, 0);
}

/** Selects scheduled tier ledgers. Empty fields match all. */
export class ScheduledTierLedgerQuery {
  name: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAmount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledTierLedger): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledTierLedger[]): ScheduledTierLedger[] {
    const matched = collections.filter(items, (candidate: ScheduledTierLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledTierLedgers(store: ScheduledTierLedgerStore, query: ScheduledTierLedgerQuery): ScheduledTierLedger[] {
  return query.apply(store.list());
}
