import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedReplyLedger } from "./capped-reply-ledger.js";

/** Keeps capped reply ledgers by code. */
export interface CappedReplyLedgerStore {
  find(code: string): CappedReplyLedger | undefined;
  save(item: CappedReplyLedger): void;
  remove(code: string): boolean;
  list(): CappedReplyLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedReplyLedgerStore implements CappedReplyLedgerStore {
  items: Map<string, CappedReplyLedger>;
  order: string[];

  constructor(items: Map<string, CappedReplyLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedReplyLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedReplyLedger): void {
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

  list(): CappedReplyLedger[] {
    const out: CappedReplyLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedReplyLedgerStore(): CappedReplyLedgerStore {
  return new MemoryCappedReplyLedgerStore(new Map<string, CappedReplyLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedReplyLedgerStore implements CappedReplyLedgerStore {
  inner: CappedReplyLedgerStore;
  cache: cache.TtlCache<CappedReplyLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedReplyLedgerStore,
    cacheValue: cache.TtlCache<CappedReplyLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedReplyLedger | undefined {
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

  save(item: CappedReplyLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedReplyLedger[] {
    return this.inner.list();
  }
}

export function newCachedCappedReplyLedgerStore(inner: CappedReplyLedgerStore, ttl: number, clockValue: clock.Clock): CappedReplyLedgerStore {
  return new CachedCappedReplyLedgerStore(inner, cache.newTtlCache<CappedReplyLedger>(256, ttl, clockValue), 0, 0);
}

/** Selects capped reply ledgers. Empty fields match all. */
export class CappedReplyLedgerQuery {
  channel: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCost: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedReplyLedger): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedReplyLedger[]): CappedReplyLedger[] {
    const matched = collections.filter(items, (candidate: CappedReplyLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedReplyLedgers(store: CappedReplyLedgerStore, query: CappedReplyLedgerQuery): CappedReplyLedger[] {
  return query.apply(store.list());
}
