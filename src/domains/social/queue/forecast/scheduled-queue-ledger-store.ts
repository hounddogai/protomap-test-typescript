import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledQueueLedger } from "./scheduled-queue-ledger.js";

/** Keeps scheduled queue ledgers by code. */
export interface ScheduledQueueLedgerStore {
  find(code: string): ScheduledQueueLedger | undefined;
  save(item: ScheduledQueueLedger): void;
  remove(code: string): boolean;
  list(): ScheduledQueueLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledQueueLedgerStore implements ScheduledQueueLedgerStore {
  items: Map<string, ScheduledQueueLedger>;
  order: string[];

  constructor(items: Map<string, ScheduledQueueLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledQueueLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledQueueLedger): void {
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

  list(): ScheduledQueueLedger[] {
    const out: ScheduledQueueLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledQueueLedgerStore(): ScheduledQueueLedgerStore {
  return new MemoryScheduledQueueLedgerStore(new Map<string, ScheduledQueueLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledQueueLedgerStore implements ScheduledQueueLedgerStore {
  inner: ScheduledQueueLedgerStore;
  cache: cache.TtlCache<ScheduledQueueLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledQueueLedgerStore,
    cacheValue: cache.TtlCache<ScheduledQueueLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledQueueLedger | undefined {
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

  save(item: ScheduledQueueLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledQueueLedger[] {
    return this.inner.list();
  }
}

export function newCachedScheduledQueueLedgerStore(inner: ScheduledQueueLedgerStore, ttl: number, clockValue: clock.Clock): ScheduledQueueLedgerStore {
  return new CachedScheduledQueueLedgerStore(
    inner,
    cache.newTtlCache<ScheduledQueueLedger>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled queue ledgers. Empty fields match all. */
export class ScheduledQueueLedgerQuery {
  name: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minThreshold: number, statuses: string[], limit: number) {
    this.name = name;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledQueueLedger): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledQueueLedger[]): ScheduledQueueLedger[] {
    const matched = collections.filter(items, (candidate: ScheduledQueueLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledQueueLedgers(store: ScheduledQueueLedgerStore, query: ScheduledQueueLedgerQuery): ScheduledQueueLedger[] {
  return query.apply(store.list());
}
