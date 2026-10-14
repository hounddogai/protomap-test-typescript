import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedExitRuleRecord } from "./batched-exit-rule-record.js";

/** Keeps batched exit rule records by code. */
export interface BatchedExitRuleRecordStore {
  find(code: string): BatchedExitRuleRecord | undefined;
  save(item: BatchedExitRuleRecord): void;
  remove(code: string): boolean;
  list(): BatchedExitRuleRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedExitRuleRecordStore implements BatchedExitRuleRecordStore {
  items: Map<string, BatchedExitRuleRecord>;
  order: string[];

  constructor(items: Map<string, BatchedExitRuleRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedExitRuleRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedExitRuleRecord): void {
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

  list(): BatchedExitRuleRecord[] {
    const out: BatchedExitRuleRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedExitRuleRecordStore(): BatchedExitRuleRecordStore {
  return new MemoryBatchedExitRuleRecordStore(new Map<string, BatchedExitRuleRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedExitRuleRecordStore implements BatchedExitRuleRecordStore {
  inner: BatchedExitRuleRecordStore;
  cache: cache.TtlCache<BatchedExitRuleRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedExitRuleRecordStore,
    cacheValue: cache.TtlCache<BatchedExitRuleRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedExitRuleRecord | undefined {
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

  save(item: BatchedExitRuleRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedExitRuleRecord[] {
    return this.inner.list();
  }
}

export function newCachedBatchedExitRuleRecordStore(inner: BatchedExitRuleRecordStore, ttl: number, clockValue: clock.Clock): BatchedExitRuleRecordStore {
  return new CachedBatchedExitRuleRecordStore(
    inner,
    cache.newTtlCache<BatchedExitRuleRecord>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched exit rule records. Empty fields match all. */
export class BatchedExitRuleRecordQuery {
  label: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRevision: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedExitRuleRecord): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedExitRuleRecord[]): BatchedExitRuleRecord[] {
    const matched = collections.filter(items, (candidate: BatchedExitRuleRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedExitRuleRecords(store: BatchedExitRuleRecordStore, query: BatchedExitRuleRecordQuery): BatchedExitRuleRecord[] {
  return query.apply(store.list());
}
