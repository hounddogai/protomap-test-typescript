import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledReplyLedger } from "./scheduled-reply-ledger.js";

/** Keeps scheduled reply ledgers by code. */
export interface ScheduledReplyLedgerStore {
  find(code: string): ScheduledReplyLedger | undefined;
  save(item: ScheduledReplyLedger): void;
  remove(code: string): boolean;
  list(): ScheduledReplyLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledReplyLedgerStore implements ScheduledReplyLedgerStore {
  items: Map<string, ScheduledReplyLedger>;
  order: string[];

  constructor(items: Map<string, ScheduledReplyLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledReplyLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledReplyLedger): void {
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

  list(): ScheduledReplyLedger[] {
    const out: ScheduledReplyLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledReplyLedgerStore(): ScheduledReplyLedgerStore {
  return new MemoryScheduledReplyLedgerStore(new Map<string, ScheduledReplyLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledReplyLedgerStore implements ScheduledReplyLedgerStore {
  inner: ScheduledReplyLedgerStore;
  cache: cache.TtlCache<ScheduledReplyLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledReplyLedgerStore,
    cacheValue: cache.TtlCache<ScheduledReplyLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledReplyLedger | undefined {
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

  save(item: ScheduledReplyLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledReplyLedger[] {
    return this.inner.list();
  }
}

export function newCachedScheduledReplyLedgerStore(inner: ScheduledReplyLedgerStore, ttl: number, clockValue: clock.Clock): ScheduledReplyLedgerStore {
  return new CachedScheduledReplyLedgerStore(
    inner,
    cache.newTtlCache<ScheduledReplyLedger>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled reply ledgers. Empty fields match all. */
export class ScheduledReplyLedgerQuery {
  unit: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minBudget: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledReplyLedger): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledReplyLedger[]): ScheduledReplyLedger[] {
    const matched = collections.filter(items, (candidate: ScheduledReplyLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledReplyLedgers(store: ScheduledReplyLedgerStore, query: ScheduledReplyLedgerQuery): ScheduledReplyLedger[] {
  return query.apply(store.list());
}
