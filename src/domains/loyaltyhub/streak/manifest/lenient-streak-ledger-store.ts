import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientStreakLedger } from "./lenient-streak-ledger.js";

/** Keeps lenient streak ledgers by code. */
export interface LenientStreakLedgerStore {
  find(code: string): LenientStreakLedger | undefined;
  save(item: LenientStreakLedger): void;
  remove(code: string): boolean;
  list(): LenientStreakLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientStreakLedgerStore implements LenientStreakLedgerStore {
  items: Map<string, LenientStreakLedger>;
  order: string[];

  constructor(items: Map<string, LenientStreakLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientStreakLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientStreakLedger): void {
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

  list(): LenientStreakLedger[] {
    const out: LenientStreakLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientStreakLedgerStore(): LenientStreakLedgerStore {
  return new MemoryLenientStreakLedgerStore(new Map<string, LenientStreakLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientStreakLedgerStore implements LenientStreakLedgerStore {
  inner: LenientStreakLedgerStore;
  cache: cache.TtlCache<LenientStreakLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientStreakLedgerStore,
    cacheValue: cache.TtlCache<LenientStreakLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientStreakLedger | undefined {
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

  save(item: LenientStreakLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientStreakLedger[] {
    return this.inner.list();
  }
}

export function newCachedLenientStreakLedgerStore(inner: LenientStreakLedgerStore, ttl: number, clockValue: clock.Clock): LenientStreakLedgerStore {
  return new CachedLenientStreakLedgerStore(inner, cache.newTtlCache<LenientStreakLedger>(1024, ttl, clockValue), 0, 0);
}

/** Selects lenient streak ledgers. Empty fields match all. */
export class LenientStreakLedgerQuery {
  locale: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minClicks: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientStreakLedger): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientStreakLedger[]): LenientStreakLedger[] {
    const matched = collections.filter(items, (candidate: LenientStreakLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientStreakLedgers(store: LenientStreakLedgerStore, query: LenientStreakLedgerQuery): LenientStreakLedger[] {
  return query.apply(store.list());
}
