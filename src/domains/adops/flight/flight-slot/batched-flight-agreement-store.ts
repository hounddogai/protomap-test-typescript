import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedFlightAgreement } from "./batched-flight-agreement.js";

/** Keeps batched flight agreements by code. */
export interface BatchedFlightAgreementStore {
  find(code: string): BatchedFlightAgreement | undefined;
  save(item: BatchedFlightAgreement): void;
  remove(code: string): boolean;
  list(): BatchedFlightAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedFlightAgreementStore implements BatchedFlightAgreementStore {
  items: Map<string, BatchedFlightAgreement>;
  order: string[];

  constructor(items: Map<string, BatchedFlightAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedFlightAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedFlightAgreement): void {
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

  list(): BatchedFlightAgreement[] {
    const out: BatchedFlightAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedFlightAgreementStore(): BatchedFlightAgreementStore {
  return new MemoryBatchedFlightAgreementStore(new Map<string, BatchedFlightAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedFlightAgreementStore implements BatchedFlightAgreementStore {
  inner: BatchedFlightAgreementStore;
  cache: cache.TtlCache<BatchedFlightAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedFlightAgreementStore,
    cacheValue: cache.TtlCache<BatchedFlightAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedFlightAgreement | undefined {
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

  save(item: BatchedFlightAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedFlightAgreement[] {
    return this.inner.list();
  }
}

export function newCachedBatchedFlightAgreementStore(inner: BatchedFlightAgreementStore, ttl: number, clockValue: clock.Clock): BatchedFlightAgreementStore {
  return new CachedBatchedFlightAgreementStore(
    inner,
    cache.newTtlCache<BatchedFlightAgreement>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched flight agreements. Empty fields match all. */
export class BatchedFlightAgreementQuery {
  name: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBatchSize: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedFlightAgreement): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedFlightAgreement[]): BatchedFlightAgreement[] {
    const matched = collections.filter(items, (candidate: BatchedFlightAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedFlightAgreements(store: BatchedFlightAgreementStore, query: BatchedFlightAgreementQuery): BatchedFlightAgreement[] {
  return query.apply(store.list());
}
