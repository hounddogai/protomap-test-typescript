import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakLedger } from "./streak-ledger.js";

/** Keeps streak ledgers by code. */
export interface StreakLedgerStore {
  find(code: string): StreakLedger | undefined;
  save(item: StreakLedger): void;
  remove(code: string): boolean;
  list(): StreakLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakLedgerStore implements StreakLedgerStore {
  items: Map<string, StreakLedger>;
  order: string[];

  constructor(items: Map<string, StreakLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakLedger): void {
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

  list(): StreakLedger[] {
    const out: StreakLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakLedgerStore(): StreakLedgerStore {
  return new MemoryStreakLedgerStore(new Map<string, StreakLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakLedgerStore implements StreakLedgerStore {
  inner: StreakLedgerStore;
  cache: cache.TtlCache<StreakLedger>;
  hits: number;
  misses: number;

  constructor(inner: StreakLedgerStore, cacheValue: cache.TtlCache<StreakLedger>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakLedger | undefined {
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

  save(item: StreakLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakLedger[] {
    return this.inner.list();
  }
}

export function newCachedStreakLedgerStore(inner: StreakLedgerStore, ttl: number, clockValue: clock.Clock): StreakLedgerStore {
  return new CachedStreakLedgerStore(inner, cache.newTtlCache<StreakLedger>(64, ttl, clockValue), 0, 0);
}

/** Selects streak ledgers. Empty fields match all. */
export class StreakLedgerQuery {
  utmSource: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minEndsAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakLedger): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakLedger[]): StreakLedger[] {
    const matched = collections.filter(items, (candidate: StreakLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakLedgers(store: StreakLedgerStore, query: StreakLedgerQuery): StreakLedger[] {
  return query.apply(store.list());
}
