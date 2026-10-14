import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientComplaintLedger } from "./lenient-complaint-ledger.js";

/** Keeps lenient complaint ledgers by code. */
export interface LenientComplaintLedgerStore {
  find(code: string): LenientComplaintLedger | undefined;
  save(item: LenientComplaintLedger): void;
  remove(code: string): boolean;
  list(): LenientComplaintLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientComplaintLedgerStore implements LenientComplaintLedgerStore {
  items: Map<string, LenientComplaintLedger>;
  order: string[];

  constructor(items: Map<string, LenientComplaintLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientComplaintLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientComplaintLedger): void {
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

  list(): LenientComplaintLedger[] {
    const out: LenientComplaintLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientComplaintLedgerStore(): LenientComplaintLedgerStore {
  return new MemoryLenientComplaintLedgerStore(new Map<string, LenientComplaintLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientComplaintLedgerStore implements LenientComplaintLedgerStore {
  inner: LenientComplaintLedgerStore;
  cache: cache.TtlCache<LenientComplaintLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientComplaintLedgerStore,
    cacheValue: cache.TtlCache<LenientComplaintLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientComplaintLedger | undefined {
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

  save(item: LenientComplaintLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientComplaintLedger[] {
    return this.inner.list();
  }
}

export function newCachedLenientComplaintLedgerStore(inner: LenientComplaintLedgerStore, ttl: number, clockValue: clock.Clock): LenientComplaintLedgerStore {
  return new CachedLenientComplaintLedgerStore(
    inner,
    cache.newTtlCache<LenientComplaintLedger>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient complaint ledgers. Empty fields match all. */
export class LenientComplaintLedgerQuery {
  region: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.region = region;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientComplaintLedger): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientComplaintLedger[]): LenientComplaintLedger[] {
    const matched = collections.filter(items, (candidate: LenientComplaintLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientComplaintLedgers(store: LenientComplaintLedgerStore, query: LenientComplaintLedgerQuery): LenientComplaintLedger[] {
  return query.apply(store.list());
}
