import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledBranchLedger } from "./scheduled-branch-ledger.js";

/** Keeps scheduled branch ledgers by code. */
export interface ScheduledBranchLedgerStore {
  find(code: string): ScheduledBranchLedger | undefined;
  save(item: ScheduledBranchLedger): void;
  remove(code: string): boolean;
  list(): ScheduledBranchLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledBranchLedgerStore implements ScheduledBranchLedgerStore {
  items: Map<string, ScheduledBranchLedger>;
  order: string[];

  constructor(items: Map<string, ScheduledBranchLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledBranchLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledBranchLedger): void {
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

  list(): ScheduledBranchLedger[] {
    const out: ScheduledBranchLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledBranchLedgerStore(): ScheduledBranchLedgerStore {
  return new MemoryScheduledBranchLedgerStore(new Map<string, ScheduledBranchLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledBranchLedgerStore implements ScheduledBranchLedgerStore {
  inner: ScheduledBranchLedgerStore;
  cache: cache.TtlCache<ScheduledBranchLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledBranchLedgerStore,
    cacheValue: cache.TtlCache<ScheduledBranchLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledBranchLedger | undefined {
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

  save(item: ScheduledBranchLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledBranchLedger[] {
    return this.inner.list();
  }
}

export function newCachedScheduledBranchLedgerStore(inner: ScheduledBranchLedgerStore, ttl: number, clockValue: clock.Clock): ScheduledBranchLedgerStore {
  return new CachedScheduledBranchLedgerStore(
    inner,
    cache.newTtlCache<ScheduledBranchLedger>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled branch ledgers. Empty fields match all. */
export class ScheduledBranchLedgerQuery {
  segment: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledBranchLedger): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledBranchLedger[]): ScheduledBranchLedger[] {
    const matched = collections.filter(items, (candidate: ScheduledBranchLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledBranchLedgers(store: ScheduledBranchLedgerStore, query: ScheduledBranchLedgerQuery): ScheduledBranchLedger[] {
  return query.apply(store.list());
}
