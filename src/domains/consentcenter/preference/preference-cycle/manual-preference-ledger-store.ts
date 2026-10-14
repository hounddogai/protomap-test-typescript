import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualPreferenceLedger } from "./manual-preference-ledger.js";

/** Keeps manual preference ledgers by code. */
export interface ManualPreferenceLedgerStore {
  find(code: string): ManualPreferenceLedger | undefined;
  save(item: ManualPreferenceLedger): void;
  remove(code: string): boolean;
  list(): ManualPreferenceLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualPreferenceLedgerStore implements ManualPreferenceLedgerStore {
  items: Map<string, ManualPreferenceLedger>;
  order: string[];

  constructor(items: Map<string, ManualPreferenceLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualPreferenceLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualPreferenceLedger): void {
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

  list(): ManualPreferenceLedger[] {
    const out: ManualPreferenceLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualPreferenceLedgerStore(): ManualPreferenceLedgerStore {
  return new MemoryManualPreferenceLedgerStore(new Map<string, ManualPreferenceLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualPreferenceLedgerStore implements ManualPreferenceLedgerStore {
  inner: ManualPreferenceLedgerStore;
  cache: cache.TtlCache<ManualPreferenceLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualPreferenceLedgerStore,
    cacheValue: cache.TtlCache<ManualPreferenceLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualPreferenceLedger | undefined {
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

  save(item: ManualPreferenceLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualPreferenceLedger[] {
    return this.inner.list();
  }
}

export function newCachedManualPreferenceLedgerStore(inner: ManualPreferenceLedgerStore, ttl: number, clockValue: clock.Clock): ManualPreferenceLedgerStore {
  return new CachedManualPreferenceLedgerStore(
    inner,
    cache.newTtlCache<ManualPreferenceLedger>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual preference ledgers. Empty fields match all. */
export class ManualPreferenceLedgerQuery {
  segment: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minRevision: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualPreferenceLedger): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualPreferenceLedger[]): ManualPreferenceLedger[] {
    const matched = collections.filter(items, (candidate: ManualPreferenceLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualPreferenceLedgers(store: ManualPreferenceLedgerStore, query: ManualPreferenceLedgerQuery): ManualPreferenceLedger[] {
  return query.apply(store.list());
}
