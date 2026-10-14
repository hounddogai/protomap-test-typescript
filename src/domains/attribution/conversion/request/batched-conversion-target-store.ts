import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedConversionTarget } from "./batched-conversion-target.js";

/** Keeps batched conversion targets by code. */
export interface BatchedConversionTargetStore {
  find(code: string): BatchedConversionTarget | undefined;
  save(item: BatchedConversionTarget): void;
  remove(code: string): boolean;
  list(): BatchedConversionTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedConversionTargetStore implements BatchedConversionTargetStore {
  items: Map<string, BatchedConversionTarget>;
  order: string[];

  constructor(items: Map<string, BatchedConversionTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedConversionTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedConversionTarget): void {
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

  list(): BatchedConversionTarget[] {
    const out: BatchedConversionTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedConversionTargetStore(): BatchedConversionTargetStore {
  return new MemoryBatchedConversionTargetStore(new Map<string, BatchedConversionTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedConversionTargetStore implements BatchedConversionTargetStore {
  inner: BatchedConversionTargetStore;
  cache: cache.TtlCache<BatchedConversionTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedConversionTargetStore,
    cacheValue: cache.TtlCache<BatchedConversionTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedConversionTarget | undefined {
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

  save(item: BatchedConversionTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedConversionTarget[] {
    return this.inner.list();
  }
}

export function newCachedBatchedConversionTargetStore(inner: BatchedConversionTargetStore, ttl: number, clockValue: clock.Clock): BatchedConversionTargetStore {
  return new CachedBatchedConversionTargetStore(
    inner,
    cache.newTtlCache<BatchedConversionTarget>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched conversion targets. Empty fields match all. */
export class BatchedConversionTargetQuery {
  locale: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRatio: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedConversionTarget): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedConversionTarget[]): BatchedConversionTarget[] {
    const matched = collections.filter(items, (candidate: BatchedConversionTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedConversionTargets(store: BatchedConversionTargetStore, query: BatchedConversionTargetQuery): BatchedConversionTarget[] {
  return query.apply(store.list());
}
