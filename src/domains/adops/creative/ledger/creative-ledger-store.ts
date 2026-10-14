import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeLedger } from "./creative-ledger.js";

/** Keeps creative ledgers by code. */
export interface CreativeLedgerStore {
  find(code: string): CreativeLedger | undefined;
  save(item: CreativeLedger): void;
  remove(code: string): boolean;
  list(): CreativeLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeLedgerStore implements CreativeLedgerStore {
  items: Map<string, CreativeLedger>;
  order: string[];

  constructor(items: Map<string, CreativeLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeLedger): void {
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

  list(): CreativeLedger[] {
    const out: CreativeLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeLedgerStore(): CreativeLedgerStore {
  return new MemoryCreativeLedgerStore(new Map<string, CreativeLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeLedgerStore implements CreativeLedgerStore {
  inner: CreativeLedgerStore;
  cache: cache.TtlCache<CreativeLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: CreativeLedgerStore,
    cacheValue: cache.TtlCache<CreativeLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeLedger | undefined {
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

  save(item: CreativeLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeLedger[] {
    return this.inner.list();
  }
}

export function newCachedCreativeLedgerStore(inner: CreativeLedgerStore, ttl: number, clockValue: clock.Clock): CreativeLedgerStore {
  return new CachedCreativeLedgerStore(inner, cache.newTtlCache<CreativeLedger>(128, ttl, clockValue), 0, 0);
}

/** Selects creative ledgers. Empty fields match all. */
export class CreativeLedgerQuery {
  title: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBid: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeLedger): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeLedger[]): CreativeLedger[] {
    const matched = collections.filter(items, (candidate: CreativeLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeLedgers(store: CreativeLedgerStore, query: CreativeLedgerQuery): CreativeLedger[] {
  return query.apply(store.list());
}
