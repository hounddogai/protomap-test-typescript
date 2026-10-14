import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingSuppressionLedger } from "./rolling-suppression-ledger.js";

/** Keeps rolling suppression ledgers by code. */
export interface RollingSuppressionLedgerStore {
  find(code: string): RollingSuppressionLedger | undefined;
  save(item: RollingSuppressionLedger): void;
  remove(code: string): boolean;
  list(): RollingSuppressionLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingSuppressionLedgerStore implements RollingSuppressionLedgerStore {
  items: Map<string, RollingSuppressionLedger>;
  order: string[];

  constructor(items: Map<string, RollingSuppressionLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingSuppressionLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingSuppressionLedger): void {
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

  list(): RollingSuppressionLedger[] {
    const out: RollingSuppressionLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingSuppressionLedgerStore(): RollingSuppressionLedgerStore {
  return new MemoryRollingSuppressionLedgerStore(new Map<string, RollingSuppressionLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingSuppressionLedgerStore implements RollingSuppressionLedgerStore {
  inner: RollingSuppressionLedgerStore;
  cache: cache.TtlCache<RollingSuppressionLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingSuppressionLedgerStore,
    cacheValue: cache.TtlCache<RollingSuppressionLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingSuppressionLedger | undefined {
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

  save(item: RollingSuppressionLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingSuppressionLedger[] {
    return this.inner.list();
  }
}

export function newCachedRollingSuppressionLedgerStore(inner: RollingSuppressionLedgerStore, ttl: number, clockValue: clock.Clock): RollingSuppressionLedgerStore {
  return new CachedRollingSuppressionLedgerStore(
    inner,
    cache.newTtlCache<RollingSuppressionLedger>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling suppression ledgers. Empty fields match all. */
export class RollingSuppressionLedgerQuery {
  channel: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMinimum: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingSuppressionLedger): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingSuppressionLedger[]): RollingSuppressionLedger[] {
    const matched = collections.filter(items, (candidate: RollingSuppressionLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingSuppressionLedgers(store: RollingSuppressionLedgerStore, query: RollingSuppressionLedgerQuery): RollingSuppressionLedger[] {
  return query.apply(store.list());
}
