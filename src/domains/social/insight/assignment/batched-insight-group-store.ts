import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedInsightGroup } from "./batched-insight-group.js";

/** Keeps batched insight groups by code. */
export interface BatchedInsightGroupStore {
  find(code: string): BatchedInsightGroup | undefined;
  save(item: BatchedInsightGroup): void;
  remove(code: string): boolean;
  list(): BatchedInsightGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedInsightGroupStore implements BatchedInsightGroupStore {
  items: Map<string, BatchedInsightGroup>;
  order: string[];

  constructor(items: Map<string, BatchedInsightGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedInsightGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedInsightGroup): void {
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

  list(): BatchedInsightGroup[] {
    const out: BatchedInsightGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedInsightGroupStore(): BatchedInsightGroupStore {
  return new MemoryBatchedInsightGroupStore(new Map<string, BatchedInsightGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedInsightGroupStore implements BatchedInsightGroupStore {
  inner: BatchedInsightGroupStore;
  cache: cache.TtlCache<BatchedInsightGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedInsightGroupStore,
    cacheValue: cache.TtlCache<BatchedInsightGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedInsightGroup | undefined {
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

  save(item: BatchedInsightGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedInsightGroup[] {
    return this.inner.list();
  }
}

export function newCachedBatchedInsightGroupStore(inner: BatchedInsightGroupStore, ttl: number, clockValue: clock.Clock): BatchedInsightGroupStore {
  return new CachedBatchedInsightGroupStore(inner, cache.newTtlCache<BatchedInsightGroup>(64, ttl, clockValue), 0, 0);
}

/** Selects batched insight groups. Empty fields match all. */
export class BatchedInsightGroupQuery {
  utmSource: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minSequence: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedInsightGroup): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedInsightGroup[]): BatchedInsightGroup[] {
    const matched = collections.filter(items, (candidate: BatchedInsightGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedInsightGroups(store: BatchedInsightGroupStore, query: BatchedInsightGroupQuery): BatchedInsightGroup[] {
  return query.apply(store.list());
}
