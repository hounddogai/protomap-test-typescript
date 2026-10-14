import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyExitRuleLedger } from "./legacy-exit-rule-ledger.js";

/** Keeps legacy exit rule ledgers by code. */
export interface LegacyExitRuleLedgerStore {
  find(code: string): LegacyExitRuleLedger | undefined;
  save(item: LegacyExitRuleLedger): void;
  remove(code: string): boolean;
  list(): LegacyExitRuleLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyExitRuleLedgerStore implements LegacyExitRuleLedgerStore {
  items: Map<string, LegacyExitRuleLedger>;
  order: string[];

  constructor(items: Map<string, LegacyExitRuleLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyExitRuleLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyExitRuleLedger): void {
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

  list(): LegacyExitRuleLedger[] {
    const out: LegacyExitRuleLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyExitRuleLedgerStore(): LegacyExitRuleLedgerStore {
  return new MemoryLegacyExitRuleLedgerStore(new Map<string, LegacyExitRuleLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyExitRuleLedgerStore implements LegacyExitRuleLedgerStore {
  inner: LegacyExitRuleLedgerStore;
  cache: cache.TtlCache<LegacyExitRuleLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyExitRuleLedgerStore,
    cacheValue: cache.TtlCache<LegacyExitRuleLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyExitRuleLedger | undefined {
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

  save(item: LegacyExitRuleLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyExitRuleLedger[] {
    return this.inner.list();
  }
}

export function newCachedLegacyExitRuleLedgerStore(inner: LegacyExitRuleLedgerStore, ttl: number, clockValue: clock.Clock): LegacyExitRuleLedgerStore {
  return new CachedLegacyExitRuleLedgerStore(
    inner,
    cache.newTtlCache<LegacyExitRuleLedger>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy exit rule ledgers. Empty fields match all. */
export class LegacyExitRuleLedgerQuery {
  country: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minQuantity: number, statuses: string[], limit: number) {
    this.country = country;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyExitRuleLedger): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyExitRuleLedger[]): LegacyExitRuleLedger[] {
    const matched = collections.filter(items, (candidate: LegacyExitRuleLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyExitRuleLedgers(store: LegacyExitRuleLedgerStore, query: LegacyExitRuleLedgerQuery): LegacyExitRuleLedger[] {
  return query.apply(store.list());
}
