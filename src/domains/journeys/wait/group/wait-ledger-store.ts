import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitLedger } from "./wait-ledger.js";

/** Keeps wait ledgers by code. */
export interface WaitLedgerStore {
  find(code: string): WaitLedger | undefined;
  save(item: WaitLedger): void;
  remove(code: string): boolean;
  list(): WaitLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitLedgerStore implements WaitLedgerStore {
  items: Map<string, WaitLedger>;
  order: string[];

  constructor(items: Map<string, WaitLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitLedger): void {
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

  list(): WaitLedger[] {
    const out: WaitLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitLedgerStore(): WaitLedgerStore {
  return new MemoryWaitLedgerStore(new Map<string, WaitLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitLedgerStore implements WaitLedgerStore {
  inner: WaitLedgerStore;
  cache: cache.TtlCache<WaitLedger>;
  hits: number;
  misses: number;

  constructor(inner: WaitLedgerStore, cacheValue: cache.TtlCache<WaitLedger>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitLedger | undefined {
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

  save(item: WaitLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitLedger[] {
    return this.inner.list();
  }
}

export function newCachedWaitLedgerStore(inner: WaitLedgerStore, ttl: number, clockValue: clock.Clock): WaitLedgerStore {
  return new CachedWaitLedgerStore(inner, cache.newTtlCache<WaitLedger>(128, ttl, clockValue), 0, 0);
}

/** Selects wait ledgers. Empty fields match all. */
export class WaitLedgerQuery {
  channel: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minScore: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitLedger): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitLedger[]): WaitLedger[] {
    const matched = collections.filter(items, (candidate: WaitLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitLedgers(store: WaitLedgerStore, query: WaitLedgerQuery): WaitLedger[] {
  return query.apply(store.list());
}
