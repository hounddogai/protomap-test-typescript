import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryInsightLedger } from "./primary-insight-ledger.js";

/** Keeps primary insight ledgers by code. */
export interface PrimaryInsightLedgerStore {
  find(code: string): PrimaryInsightLedger | undefined;
  save(item: PrimaryInsightLedger): void;
  remove(code: string): boolean;
  list(): PrimaryInsightLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryInsightLedgerStore implements PrimaryInsightLedgerStore {
  items: Map<string, PrimaryInsightLedger>;
  order: string[];

  constructor(items: Map<string, PrimaryInsightLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryInsightLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryInsightLedger): void {
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

  list(): PrimaryInsightLedger[] {
    const out: PrimaryInsightLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryInsightLedgerStore(): PrimaryInsightLedgerStore {
  return new MemoryPrimaryInsightLedgerStore(new Map<string, PrimaryInsightLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryInsightLedgerStore implements PrimaryInsightLedgerStore {
  inner: PrimaryInsightLedgerStore;
  cache: cache.TtlCache<PrimaryInsightLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryInsightLedgerStore,
    cacheValue: cache.TtlCache<PrimaryInsightLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryInsightLedger | undefined {
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

  save(item: PrimaryInsightLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryInsightLedger[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryInsightLedgerStore(inner: PrimaryInsightLedgerStore, ttl: number, clockValue: clock.Clock): PrimaryInsightLedgerStore {
  return new CachedPrimaryInsightLedgerStore(
    inner,
    cache.newTtlCache<PrimaryInsightLedger>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary insight ledgers. Empty fields match all. */
export class PrimaryInsightLedgerQuery {
  name: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minEndsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryInsightLedger): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryInsightLedger[]): PrimaryInsightLedger[] {
    const matched = collections.filter(items, (candidate: PrimaryInsightLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryInsightLedgers(store: PrimaryInsightLedgerStore, query: PrimaryInsightLedgerQuery): PrimaryInsightLedger[] {
  return query.apply(store.list());
}
