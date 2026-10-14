import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultPathLedger } from "./default-path-ledger.js";

/** Keeps default path ledgers by code. */
export interface DefaultPathLedgerStore {
  find(code: string): DefaultPathLedger | undefined;
  save(item: DefaultPathLedger): void;
  remove(code: string): boolean;
  list(): DefaultPathLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultPathLedgerStore implements DefaultPathLedgerStore {
  items: Map<string, DefaultPathLedger>;
  order: string[];

  constructor(items: Map<string, DefaultPathLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultPathLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultPathLedger): void {
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

  list(): DefaultPathLedger[] {
    const out: DefaultPathLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultPathLedgerStore(): DefaultPathLedgerStore {
  return new MemoryDefaultPathLedgerStore(new Map<string, DefaultPathLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultPathLedgerStore implements DefaultPathLedgerStore {
  inner: DefaultPathLedgerStore;
  cache: cache.TtlCache<DefaultPathLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultPathLedgerStore,
    cacheValue: cache.TtlCache<DefaultPathLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultPathLedger | undefined {
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

  save(item: DefaultPathLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultPathLedger[] {
    return this.inner.list();
  }
}

export function newCachedDefaultPathLedgerStore(inner: DefaultPathLedgerStore, ttl: number, clockValue: clock.Clock): DefaultPathLedgerStore {
  return new CachedDefaultPathLedgerStore(inner, cache.newTtlCache<DefaultPathLedger>(512, ttl, clockValue), 0, 0);
}

/** Selects default path ledgers. Empty fields match all. */
export class DefaultPathLedgerQuery {
  name: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minWindowDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultPathLedger): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultPathLedger[]): DefaultPathLedger[] {
    const matched = collections.filter(items, (candidate: DefaultPathLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultPathLedgers(store: DefaultPathLedgerStore, query: DefaultPathLedgerQuery): DefaultPathLedger[] {
  return query.apply(store.list());
}
