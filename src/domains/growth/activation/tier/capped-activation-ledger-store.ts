import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedActivationLedger } from "./capped-activation-ledger.js";

/** Keeps capped activation ledgers by code. */
export interface CappedActivationLedgerStore {
  find(code: string): CappedActivationLedger | undefined;
  save(item: CappedActivationLedger): void;
  remove(code: string): boolean;
  list(): CappedActivationLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedActivationLedgerStore implements CappedActivationLedgerStore {
  items: Map<string, CappedActivationLedger>;
  order: string[];

  constructor(items: Map<string, CappedActivationLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedActivationLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedActivationLedger): void {
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

  list(): CappedActivationLedger[] {
    const out: CappedActivationLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedActivationLedgerStore(): CappedActivationLedgerStore {
  return new MemoryCappedActivationLedgerStore(new Map<string, CappedActivationLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedActivationLedgerStore implements CappedActivationLedgerStore {
  inner: CappedActivationLedgerStore;
  cache: cache.TtlCache<CappedActivationLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedActivationLedgerStore,
    cacheValue: cache.TtlCache<CappedActivationLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedActivationLedger | undefined {
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

  save(item: CappedActivationLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedActivationLedger[] {
    return this.inner.list();
  }
}

export function newCachedCappedActivationLedgerStore(inner: CappedActivationLedgerStore, ttl: number, clockValue: clock.Clock): CappedActivationLedgerStore {
  return new CachedCappedActivationLedgerStore(
    inner,
    cache.newTtlCache<CappedActivationLedger>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped activation ledgers. Empty fields match all. */
export class CappedActivationLedgerQuery {
  category: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minSendAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedActivationLedger): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedActivationLedger[]): CappedActivationLedger[] {
    const matched = collections.filter(items, (candidate: CappedActivationLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedActivationLedgers(store: CappedActivationLedgerStore, query: CappedActivationLedgerQuery): CappedActivationLedger[] {
  return query.apply(store.list());
}
