import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyDeflectionLedger } from "./legacy-deflection-ledger.js";

/** Keeps legacy deflection ledgers by code. */
export interface LegacyDeflectionLedgerStore {
  find(code: string): LegacyDeflectionLedger | undefined;
  save(item: LegacyDeflectionLedger): void;
  remove(code: string): boolean;
  list(): LegacyDeflectionLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyDeflectionLedgerStore implements LegacyDeflectionLedgerStore {
  items: Map<string, LegacyDeflectionLedger>;
  order: string[];

  constructor(items: Map<string, LegacyDeflectionLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyDeflectionLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyDeflectionLedger): void {
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

  list(): LegacyDeflectionLedger[] {
    const out: LegacyDeflectionLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyDeflectionLedgerStore(): LegacyDeflectionLedgerStore {
  return new MemoryLegacyDeflectionLedgerStore(new Map<string, LegacyDeflectionLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyDeflectionLedgerStore implements LegacyDeflectionLedgerStore {
  inner: LegacyDeflectionLedgerStore;
  cache: cache.TtlCache<LegacyDeflectionLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyDeflectionLedgerStore,
    cacheValue: cache.TtlCache<LegacyDeflectionLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyDeflectionLedger | undefined {
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

  save(item: LegacyDeflectionLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyDeflectionLedger[] {
    return this.inner.list();
  }
}

export function newCachedLegacyDeflectionLedgerStore(inner: LegacyDeflectionLedgerStore, ttl: number, clockValue: clock.Clock): LegacyDeflectionLedgerStore {
  return new CachedLegacyDeflectionLedgerStore(
    inner,
    cache.newTtlCache<LegacyDeflectionLedger>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy deflection ledgers. Empty fields match all. */
export class LegacyDeflectionLedgerQuery {
  label: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMargin: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyDeflectionLedger): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyDeflectionLedger[]): LegacyDeflectionLedger[] {
    const matched = collections.filter(items, (candidate: LegacyDeflectionLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyDeflectionLedgers(store: LegacyDeflectionLedgerStore, query: LegacyDeflectionLedgerQuery): LegacyDeflectionLedger[] {
  return query.apply(store.list());
}
