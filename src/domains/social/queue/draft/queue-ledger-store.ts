import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueLedger } from "./queue-ledger.js";

/** Keeps queue ledgers by code. */
export interface QueueLedgerStore {
  find(code: string): QueueLedger | undefined;
  save(item: QueueLedger): void;
  remove(code: string): boolean;
  list(): QueueLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueLedgerStore implements QueueLedgerStore {
  items: Map<string, QueueLedger>;
  order: string[];

  constructor(items: Map<string, QueueLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueLedger): void {
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

  list(): QueueLedger[] {
    const out: QueueLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueLedgerStore(): QueueLedgerStore {
  return new MemoryQueueLedgerStore(new Map<string, QueueLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueLedgerStore implements QueueLedgerStore {
  inner: QueueLedgerStore;
  cache: cache.TtlCache<QueueLedger>;
  hits: number;
  misses: number;

  constructor(inner: QueueLedgerStore, cacheValue: cache.TtlCache<QueueLedger>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueLedger | undefined {
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

  save(item: QueueLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueLedger[] {
    return this.inner.list();
  }
}

export function newCachedQueueLedgerStore(inner: QueueLedgerStore, ttl: number, clockValue: clock.Clock): QueueLedgerStore {
  return new CachedQueueLedgerStore(inner, cache.newTtlCache<QueueLedger>(128, ttl, clockValue), 0, 0);
}

/** Selects queue ledgers. Empty fields match all. */
export class QueueLedgerQuery {
  title: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueLedger): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueLedger[]): QueueLedger[] {
    const matched = collections.filter(items, (candidate: QueueLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueLedgers(store: QueueLedgerStore, query: QueueLedgerQuery): QueueLedger[] {
  return query.apply(store.list());
}
