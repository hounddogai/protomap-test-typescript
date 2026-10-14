import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyDomainLedger } from "./legacy-domain-ledger.js";

/** Keeps legacy domain ledgers by code. */
export interface LegacyDomainLedgerStore {
  find(code: string): LegacyDomainLedger | undefined;
  save(item: LegacyDomainLedger): void;
  remove(code: string): boolean;
  list(): LegacyDomainLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyDomainLedgerStore implements LegacyDomainLedgerStore {
  items: Map<string, LegacyDomainLedger>;
  order: string[];

  constructor(items: Map<string, LegacyDomainLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyDomainLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyDomainLedger): void {
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

  list(): LegacyDomainLedger[] {
    const out: LegacyDomainLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyDomainLedgerStore(): LegacyDomainLedgerStore {
  return new MemoryLegacyDomainLedgerStore(new Map<string, LegacyDomainLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyDomainLedgerStore implements LegacyDomainLedgerStore {
  inner: LegacyDomainLedgerStore;
  cache: cache.TtlCache<LegacyDomainLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyDomainLedgerStore,
    cacheValue: cache.TtlCache<LegacyDomainLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyDomainLedger | undefined {
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

  save(item: LegacyDomainLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyDomainLedger[] {
    return this.inner.list();
  }
}

export function newCachedLegacyDomainLedgerStore(inner: LegacyDomainLedgerStore, ttl: number, clockValue: clock.Clock): LegacyDomainLedgerStore {
  return new CachedLegacyDomainLedgerStore(inner, cache.newTtlCache<LegacyDomainLedger>(512, ttl, clockValue), 0, 0);
}

/** Selects legacy domain ledgers. Empty fields match all. */
export class LegacyDomainLedgerQuery {
  region: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyDomainLedger): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyDomainLedger[]): LegacyDomainLedger[] {
    const matched = collections.filter(items, (candidate: LegacyDomainLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyDomainLedgers(store: LegacyDomainLedgerStore, query: LegacyDomainLedgerQuery): LegacyDomainLedger[] {
  return query.apply(store.list());
}
