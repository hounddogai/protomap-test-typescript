import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingComplaintLedger } from "./rolling-complaint-ledger.js";

/** Keeps rolling complaint ledgers by code. */
export interface RollingComplaintLedgerStore {
  find(code: string): RollingComplaintLedger | undefined;
  save(item: RollingComplaintLedger): void;
  remove(code: string): boolean;
  list(): RollingComplaintLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingComplaintLedgerStore implements RollingComplaintLedgerStore {
  items: Map<string, RollingComplaintLedger>;
  order: string[];

  constructor(items: Map<string, RollingComplaintLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingComplaintLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingComplaintLedger): void {
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

  list(): RollingComplaintLedger[] {
    const out: RollingComplaintLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingComplaintLedgerStore(): RollingComplaintLedgerStore {
  return new MemoryRollingComplaintLedgerStore(new Map<string, RollingComplaintLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingComplaintLedgerStore implements RollingComplaintLedgerStore {
  inner: RollingComplaintLedgerStore;
  cache: cache.TtlCache<RollingComplaintLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingComplaintLedgerStore,
    cacheValue: cache.TtlCache<RollingComplaintLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingComplaintLedger | undefined {
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

  save(item: RollingComplaintLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingComplaintLedger[] {
    return this.inner.list();
  }
}

export function newCachedRollingComplaintLedgerStore(inner: RollingComplaintLedgerStore, ttl: number, clockValue: clock.Clock): RollingComplaintLedgerStore {
  return new CachedRollingComplaintLedgerStore(
    inner,
    cache.newTtlCache<RollingComplaintLedger>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling complaint ledgers. Empty fields match all. */
export class RollingComplaintLedgerQuery {
  label: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSequence: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingComplaintLedger): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingComplaintLedger[]): RollingComplaintLedger[] {
    const matched = collections.filter(items, (candidate: RollingComplaintLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingComplaintLedgers(store: RollingComplaintLedgerStore, query: RollingComplaintLedgerQuery): RollingComplaintLedger[] {
  return query.apply(store.list());
}
