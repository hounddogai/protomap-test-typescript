import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewBatch } from "./ticket-view-batch.js";

/** Keeps ticket view batches by code. */
export interface TicketViewBatchStore {
  find(code: string): TicketViewBatch | undefined;
  save(item: TicketViewBatch): void;
  remove(code: string): boolean;
  list(): TicketViewBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewBatchStore implements TicketViewBatchStore {
  items: Map<string, TicketViewBatch>;
  order: string[];

  constructor(items: Map<string, TicketViewBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewBatch): void {
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

  list(): TicketViewBatch[] {
    const out: TicketViewBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewBatchStore(): TicketViewBatchStore {
  return new MemoryTicketViewBatchStore(new Map<string, TicketViewBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewBatchStore implements TicketViewBatchStore {
  inner: TicketViewBatchStore;
  cache: cache.TtlCache<TicketViewBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewBatchStore,
    cacheValue: cache.TtlCache<TicketViewBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewBatch | undefined {
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

  save(item: TicketViewBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewBatch[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewBatchStore(inner: TicketViewBatchStore, ttl: number, clockValue: clock.Clock): TicketViewBatchStore {
  return new CachedTicketViewBatchStore(inner, cache.newTtlCache<TicketViewBatch>(128, ttl, clockValue), 0, 0);
}

/** Selects ticket view batches. Empty fields match all. */
export class TicketViewBatchQuery {
  segment: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minBatchSize: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewBatch): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewBatch[]): TicketViewBatch[] {
    const matched = collections.filter(items, (candidate: TicketViewBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewBatches(store: TicketViewBatchStore, query: TicketViewBatchQuery): TicketViewBatch[] {
  return query.apply(store.list());
}
