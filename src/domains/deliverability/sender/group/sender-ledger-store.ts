import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderLedger } from "./sender-ledger.js";

/** Keeps sender ledgers by code. */
export interface SenderLedgerStore {
  find(code: string): SenderLedger | undefined;
  save(item: SenderLedger): void;
  remove(code: string): boolean;
  list(): SenderLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderLedgerStore implements SenderLedgerStore {
  items: Map<string, SenderLedger>;
  order: string[];

  constructor(items: Map<string, SenderLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderLedger): void {
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

  list(): SenderLedger[] {
    const out: SenderLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderLedgerStore(): SenderLedgerStore {
  return new MemorySenderLedgerStore(new Map<string, SenderLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderLedgerStore implements SenderLedgerStore {
  inner: SenderLedgerStore;
  cache: cache.TtlCache<SenderLedger>;
  hits: number;
  misses: number;

  constructor(inner: SenderLedgerStore, cacheValue: cache.TtlCache<SenderLedger>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderLedger | undefined {
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

  save(item: SenderLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderLedger[] {
    return this.inner.list();
  }
}

export function newCachedSenderLedgerStore(inner: SenderLedgerStore, ttl: number, clockValue: clock.Clock): SenderLedgerStore {
  return new CachedSenderLedgerStore(inner, cache.newTtlCache<SenderLedger>(256, ttl, clockValue), 0, 0);
}

/** Selects sender ledgers. Empty fields match all. */
export class SenderLedgerQuery {
  label: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCost: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SenderLedger): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderLedger[]): SenderLedger[] {
    const matched = collections.filter(items, (candidate: SenderLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderLedgers(store: SenderLedgerStore, query: SenderLedgerQuery): SenderLedger[] {
  return query.apply(store.list());
}
