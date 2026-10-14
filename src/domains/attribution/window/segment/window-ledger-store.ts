import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowLedger } from "./window-ledger.js";

/** Keeps window ledgers by code. */
export interface WindowLedgerStore {
  find(code: string): WindowLedger | undefined;
  save(item: WindowLedger): void;
  remove(code: string): boolean;
  list(): WindowLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowLedgerStore implements WindowLedgerStore {
  items: Map<string, WindowLedger>;
  order: string[];

  constructor(items: Map<string, WindowLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowLedger): void {
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

  list(): WindowLedger[] {
    const out: WindowLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowLedgerStore(): WindowLedgerStore {
  return new MemoryWindowLedgerStore(new Map<string, WindowLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowLedgerStore implements WindowLedgerStore {
  inner: WindowLedgerStore;
  cache: cache.TtlCache<WindowLedger>;
  hits: number;
  misses: number;

  constructor(inner: WindowLedgerStore, cacheValue: cache.TtlCache<WindowLedger>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowLedger | undefined {
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

  save(item: WindowLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowLedger[] {
    return this.inner.list();
  }
}

export function newCachedWindowLedgerStore(inner: WindowLedgerStore, ttl: number, clockValue: clock.Clock): WindowLedgerStore {
  return new CachedWindowLedgerStore(inner, cache.newTtlCache<WindowLedger>(64, ttl, clockValue), 0, 0);
}

/** Selects window ledgers. Empty fields match all. */
export class WindowLedgerQuery {
  name: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WindowLedger): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowLedger[]): WindowLedger[] {
    const matched = collections.filter(items, (candidate: WindowLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowLedgers(store: WindowLedgerStore, query: WindowLedgerQuery): WindowLedger[] {
  return query.apply(store.list());
}
