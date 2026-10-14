import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortLedger } from "./cohort-ledger.js";

/** Keeps cohort ledgers by code. */
export interface CohortLedgerStore {
  find(code: string): CohortLedger | undefined;
  save(item: CohortLedger): void;
  remove(code: string): boolean;
  list(): CohortLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortLedgerStore implements CohortLedgerStore {
  items: Map<string, CohortLedger>;
  order: string[];

  constructor(items: Map<string, CohortLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortLedger): void {
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

  list(): CohortLedger[] {
    const out: CohortLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortLedgerStore(): CohortLedgerStore {
  return new MemoryCohortLedgerStore(new Map<string, CohortLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortLedgerStore implements CohortLedgerStore {
  inner: CohortLedgerStore;
  cache: cache.TtlCache<CohortLedger>;
  hits: number;
  misses: number;

  constructor(inner: CohortLedgerStore, cacheValue: cache.TtlCache<CohortLedger>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortLedger | undefined {
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

  save(item: CohortLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortLedger[] {
    return this.inner.list();
  }
}

export function newCachedCohortLedgerStore(inner: CohortLedgerStore, ttl: number, clockValue: clock.Clock): CohortLedgerStore {
  return new CachedCohortLedgerStore(inner, cache.newTtlCache<CohortLedger>(128, ttl, clockValue), 0, 0);
}

/** Selects cohort ledgers. Empty fields match all. */
export class CohortLedgerQuery {
  name: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSequence: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortLedger): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortLedger[]): CohortLedger[] {
    const matched = collections.filter(items, (candidate: CohortLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortLedgers(store: CohortLedgerStore, query: CohortLedgerQuery): CohortLedger[] {
  return query.apply(store.list());
}
