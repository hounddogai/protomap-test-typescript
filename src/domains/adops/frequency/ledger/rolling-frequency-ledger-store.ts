import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingFrequencyLedger } from "./rolling-frequency-ledger.js";

/** Keeps rolling frequency ledgers by code. */
export interface RollingFrequencyLedgerStore {
  find(code: string): RollingFrequencyLedger | undefined;
  save(item: RollingFrequencyLedger): void;
  remove(code: string): boolean;
  list(): RollingFrequencyLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingFrequencyLedgerStore implements RollingFrequencyLedgerStore {
  items: Map<string, RollingFrequencyLedger>;
  order: string[];

  constructor(items: Map<string, RollingFrequencyLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingFrequencyLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingFrequencyLedger): void {
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

  list(): RollingFrequencyLedger[] {
    const out: RollingFrequencyLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingFrequencyLedgerStore(): RollingFrequencyLedgerStore {
  return new MemoryRollingFrequencyLedgerStore(new Map<string, RollingFrequencyLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingFrequencyLedgerStore implements RollingFrequencyLedgerStore {
  inner: RollingFrequencyLedgerStore;
  cache: cache.TtlCache<RollingFrequencyLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingFrequencyLedgerStore,
    cacheValue: cache.TtlCache<RollingFrequencyLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingFrequencyLedger | undefined {
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

  save(item: RollingFrequencyLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingFrequencyLedger[] {
    return this.inner.list();
  }
}

export function newCachedRollingFrequencyLedgerStore(inner: RollingFrequencyLedgerStore, ttl: number, clockValue: clock.Clock): RollingFrequencyLedgerStore {
  return new CachedRollingFrequencyLedgerStore(
    inner,
    cache.newTtlCache<RollingFrequencyLedger>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling frequency ledgers. Empty fields match all. */
export class RollingFrequencyLedgerQuery {
  source: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minMargin: number, statuses: string[], limit: number) {
    this.source = source;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingFrequencyLedger): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingFrequencyLedger[]): RollingFrequencyLedger[] {
    const matched = collections.filter(items, (candidate: RollingFrequencyLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingFrequencyLedgers(store: RollingFrequencyLedgerStore, query: RollingFrequencyLedgerQuery): RollingFrequencyLedger[] {
  return query.apply(store.list());
}
