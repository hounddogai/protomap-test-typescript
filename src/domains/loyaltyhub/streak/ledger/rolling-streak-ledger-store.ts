import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingStreakLedger } from "./rolling-streak-ledger.js";

/** Keeps rolling streak ledgers by code. */
export interface RollingStreakLedgerStore {
  find(code: string): RollingStreakLedger | undefined;
  save(item: RollingStreakLedger): void;
  remove(code: string): boolean;
  list(): RollingStreakLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingStreakLedgerStore implements RollingStreakLedgerStore {
  items: Map<string, RollingStreakLedger>;
  order: string[];

  constructor(items: Map<string, RollingStreakLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingStreakLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingStreakLedger): void {
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

  list(): RollingStreakLedger[] {
    const out: RollingStreakLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingStreakLedgerStore(): RollingStreakLedgerStore {
  return new MemoryRollingStreakLedgerStore(new Map<string, RollingStreakLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingStreakLedgerStore implements RollingStreakLedgerStore {
  inner: RollingStreakLedgerStore;
  cache: cache.TtlCache<RollingStreakLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingStreakLedgerStore,
    cacheValue: cache.TtlCache<RollingStreakLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingStreakLedger | undefined {
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

  save(item: RollingStreakLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingStreakLedger[] {
    return this.inner.list();
  }
}

export function newCachedRollingStreakLedgerStore(inner: RollingStreakLedgerStore, ttl: number, clockValue: clock.Clock): RollingStreakLedgerStore {
  return new CachedRollingStreakLedgerStore(inner, cache.newTtlCache<RollingStreakLedger>(64, ttl, clockValue), 0, 0);
}

/** Selects rolling streak ledgers. Empty fields match all. */
export class RollingStreakLedgerQuery {
  source: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingStreakLedger): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingStreakLedger[]): RollingStreakLedger[] {
    const matched = collections.filter(items, (candidate: RollingStreakLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingStreakLedgers(store: RollingStreakLedgerStore, query: RollingStreakLedgerQuery): RollingStreakLedger[] {
  return query.apply(store.list());
}
