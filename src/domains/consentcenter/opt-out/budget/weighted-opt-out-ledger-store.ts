import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedOptOutLedger } from "./weighted-opt-out-ledger.js";

/** Keeps weighted opt out ledgers by code. */
export interface WeightedOptOutLedgerStore {
  find(code: string): WeightedOptOutLedger | undefined;
  save(item: WeightedOptOutLedger): void;
  remove(code: string): boolean;
  list(): WeightedOptOutLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedOptOutLedgerStore implements WeightedOptOutLedgerStore {
  items: Map<string, WeightedOptOutLedger>;
  order: string[];

  constructor(items: Map<string, WeightedOptOutLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedOptOutLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedOptOutLedger): void {
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

  list(): WeightedOptOutLedger[] {
    const out: WeightedOptOutLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedOptOutLedgerStore(): WeightedOptOutLedgerStore {
  return new MemoryWeightedOptOutLedgerStore(new Map<string, WeightedOptOutLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedOptOutLedgerStore implements WeightedOptOutLedgerStore {
  inner: WeightedOptOutLedgerStore;
  cache: cache.TtlCache<WeightedOptOutLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedOptOutLedgerStore,
    cacheValue: cache.TtlCache<WeightedOptOutLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedOptOutLedger | undefined {
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

  save(item: WeightedOptOutLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedOptOutLedger[] {
    return this.inner.list();
  }
}

export function newCachedWeightedOptOutLedgerStore(inner: WeightedOptOutLedgerStore, ttl: number, clockValue: clock.Clock): WeightedOptOutLedgerStore {
  return new CachedWeightedOptOutLedgerStore(
    inner,
    cache.newTtlCache<WeightedOptOutLedger>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted opt out ledgers. Empty fields match all. */
export class WeightedOptOutLedgerQuery {
  title: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.title = title;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedOptOutLedger): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedOptOutLedger[]): WeightedOptOutLedger[] {
    const matched = collections.filter(items, (candidate: WeightedOptOutLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedOptOutLedgers(store: WeightedOptOutLedgerStore, query: WeightedOptOutLedgerQuery): WeightedOptOutLedger[] {
  return query.apply(store.list());
}
