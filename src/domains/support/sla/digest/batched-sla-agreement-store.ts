import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedSlaAgreement } from "./batched-sla-agreement.js";

/** Keeps batched sla agreements by code. */
export interface BatchedSlaAgreementStore {
  find(code: string): BatchedSlaAgreement | undefined;
  save(item: BatchedSlaAgreement): void;
  remove(code: string): boolean;
  list(): BatchedSlaAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedSlaAgreementStore implements BatchedSlaAgreementStore {
  items: Map<string, BatchedSlaAgreement>;
  order: string[];

  constructor(items: Map<string, BatchedSlaAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedSlaAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedSlaAgreement): void {
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

  list(): BatchedSlaAgreement[] {
    const out: BatchedSlaAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedSlaAgreementStore(): BatchedSlaAgreementStore {
  return new MemoryBatchedSlaAgreementStore(new Map<string, BatchedSlaAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedSlaAgreementStore implements BatchedSlaAgreementStore {
  inner: BatchedSlaAgreementStore;
  cache: cache.TtlCache<BatchedSlaAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedSlaAgreementStore,
    cacheValue: cache.TtlCache<BatchedSlaAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedSlaAgreement | undefined {
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

  save(item: BatchedSlaAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedSlaAgreement[] {
    return this.inner.list();
  }
}

export function newCachedBatchedSlaAgreementStore(inner: BatchedSlaAgreementStore, ttl: number, clockValue: clock.Clock): BatchedSlaAgreementStore {
  return new CachedBatchedSlaAgreementStore(inner, cache.newTtlCache<BatchedSlaAgreement>(512, ttl, clockValue), 0, 0);
}

/** Selects batched sla agreements. Empty fields match all. */
export class BatchedSlaAgreementQuery {
  label: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minImpressions: number, statuses: string[], limit: number) {
    this.label = label;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedSlaAgreement): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedSlaAgreement[]): BatchedSlaAgreement[] {
    const matched = collections.filter(items, (candidate: BatchedSlaAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedSlaAgreements(store: BatchedSlaAgreementStore, query: BatchedSlaAgreementQuery): BatchedSlaAgreement[] {
  return query.apply(store.list());
}
