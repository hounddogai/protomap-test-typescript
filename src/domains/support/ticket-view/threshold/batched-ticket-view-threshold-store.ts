import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedTicketViewThreshold } from "./batched-ticket-view-threshold.js";

/** Keeps batched ticket view thresholds by code. */
export interface BatchedTicketViewThresholdStore {
  find(code: string): BatchedTicketViewThreshold | undefined;
  save(item: BatchedTicketViewThreshold): void;
  remove(code: string): boolean;
  list(): BatchedTicketViewThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedTicketViewThresholdStore implements BatchedTicketViewThresholdStore {
  items: Map<string, BatchedTicketViewThreshold>;
  order: string[];

  constructor(items: Map<string, BatchedTicketViewThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedTicketViewThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedTicketViewThreshold): void {
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

  list(): BatchedTicketViewThreshold[] {
    const out: BatchedTicketViewThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedTicketViewThresholdStore(): BatchedTicketViewThresholdStore {
  return new MemoryBatchedTicketViewThresholdStore(new Map<string, BatchedTicketViewThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedTicketViewThresholdStore implements BatchedTicketViewThresholdStore {
  inner: BatchedTicketViewThresholdStore;
  cache: cache.TtlCache<BatchedTicketViewThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedTicketViewThresholdStore,
    cacheValue: cache.TtlCache<BatchedTicketViewThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedTicketViewThreshold | undefined {
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

  save(item: BatchedTicketViewThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedTicketViewThreshold[] {
    return this.inner.list();
  }
}

export function newCachedBatchedTicketViewThresholdStore(inner: BatchedTicketViewThresholdStore, ttl: number, clockValue: clock.Clock): BatchedTicketViewThresholdStore {
  return new CachedBatchedTicketViewThresholdStore(
    inner,
    cache.newTtlCache<BatchedTicketViewThreshold>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched ticket view thresholds. Empty fields match all. */
export class BatchedTicketViewThresholdQuery {
  name: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minStartsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedTicketViewThreshold): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedTicketViewThreshold[]): BatchedTicketViewThreshold[] {
    const matched = collections.filter(items, (candidate: BatchedTicketViewThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedTicketViewThresholds(store: BatchedTicketViewThresholdStore, query: BatchedTicketViewThresholdQuery): BatchedTicketViewThreshold[] {
  return query.apply(store.list());
}
