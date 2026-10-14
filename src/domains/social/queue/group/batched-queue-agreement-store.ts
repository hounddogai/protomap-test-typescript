import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedQueueAgreement } from "./batched-queue-agreement.js";

/** Keeps batched queue agreements by code. */
export interface BatchedQueueAgreementStore {
  find(code: string): BatchedQueueAgreement | undefined;
  save(item: BatchedQueueAgreement): void;
  remove(code: string): boolean;
  list(): BatchedQueueAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedQueueAgreementStore implements BatchedQueueAgreementStore {
  items: Map<string, BatchedQueueAgreement>;
  order: string[];

  constructor(items: Map<string, BatchedQueueAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedQueueAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedQueueAgreement): void {
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

  list(): BatchedQueueAgreement[] {
    const out: BatchedQueueAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedQueueAgreementStore(): BatchedQueueAgreementStore {
  return new MemoryBatchedQueueAgreementStore(new Map<string, BatchedQueueAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedQueueAgreementStore implements BatchedQueueAgreementStore {
  inner: BatchedQueueAgreementStore;
  cache: cache.TtlCache<BatchedQueueAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedQueueAgreementStore,
    cacheValue: cache.TtlCache<BatchedQueueAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedQueueAgreement | undefined {
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

  save(item: BatchedQueueAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedQueueAgreement[] {
    return this.inner.list();
  }
}

export function newCachedBatchedQueueAgreementStore(inner: BatchedQueueAgreementStore, ttl: number, clockValue: clock.Clock): BatchedQueueAgreementStore {
  return new CachedBatchedQueueAgreementStore(
    inner,
    cache.newTtlCache<BatchedQueueAgreement>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched queue agreements. Empty fields match all. */
export class BatchedQueueAgreementQuery {
  unit: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minRevision: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedQueueAgreement): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedQueueAgreement[]): BatchedQueueAgreement[] {
    const matched = collections.filter(items, (candidate: BatchedQueueAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedQueueAgreements(store: BatchedQueueAgreementStore, query: BatchedQueueAgreementQuery): BatchedQueueAgreement[] {
  return query.apply(store.list());
}
