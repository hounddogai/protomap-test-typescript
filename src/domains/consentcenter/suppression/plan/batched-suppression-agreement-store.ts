import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedSuppressionAgreement } from "./batched-suppression-agreement.js";

/** Keeps batched suppression agreements by code. */
export interface BatchedSuppressionAgreementStore {
  find(code: string): BatchedSuppressionAgreement | undefined;
  save(item: BatchedSuppressionAgreement): void;
  remove(code: string): boolean;
  list(): BatchedSuppressionAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedSuppressionAgreementStore implements BatchedSuppressionAgreementStore {
  items: Map<string, BatchedSuppressionAgreement>;
  order: string[];

  constructor(items: Map<string, BatchedSuppressionAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedSuppressionAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedSuppressionAgreement): void {
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

  list(): BatchedSuppressionAgreement[] {
    const out: BatchedSuppressionAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedSuppressionAgreementStore(): BatchedSuppressionAgreementStore {
  return new MemoryBatchedSuppressionAgreementStore(new Map<string, BatchedSuppressionAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedSuppressionAgreementStore implements BatchedSuppressionAgreementStore {
  inner: BatchedSuppressionAgreementStore;
  cache: cache.TtlCache<BatchedSuppressionAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedSuppressionAgreementStore,
    cacheValue: cache.TtlCache<BatchedSuppressionAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedSuppressionAgreement | undefined {
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

  save(item: BatchedSuppressionAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedSuppressionAgreement[] {
    return this.inner.list();
  }
}

export function newCachedBatchedSuppressionAgreementStore(inner: BatchedSuppressionAgreementStore, ttl: number, clockValue: clock.Clock): BatchedSuppressionAgreementStore {
  return new CachedBatchedSuppressionAgreementStore(
    inner,
    cache.newTtlCache<BatchedSuppressionAgreement>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched suppression agreements. Empty fields match all. */
export class BatchedSuppressionAgreementQuery {
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

  matches(item: BatchedSuppressionAgreement): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedSuppressionAgreement[]): BatchedSuppressionAgreement[] {
    const matched = collections.filter(items, (candidate: BatchedSuppressionAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedSuppressionAgreements(store: BatchedSuppressionAgreementStore, query: BatchedSuppressionAgreementQuery): BatchedSuppressionAgreement[] {
  return query.apply(store.list());
}
