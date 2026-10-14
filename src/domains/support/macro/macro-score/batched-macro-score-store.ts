import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedMacroScore } from "./batched-macro-score.js";

/** Keeps batched macro scores by code. */
export interface BatchedMacroScoreStore {
  find(code: string): BatchedMacroScore | undefined;
  save(item: BatchedMacroScore): void;
  remove(code: string): boolean;
  list(): BatchedMacroScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedMacroScoreStore implements BatchedMacroScoreStore {
  items: Map<string, BatchedMacroScore>;
  order: string[];

  constructor(items: Map<string, BatchedMacroScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedMacroScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedMacroScore): void {
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

  list(): BatchedMacroScore[] {
    const out: BatchedMacroScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedMacroScoreStore(): BatchedMacroScoreStore {
  return new MemoryBatchedMacroScoreStore(new Map<string, BatchedMacroScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedMacroScoreStore implements BatchedMacroScoreStore {
  inner: BatchedMacroScoreStore;
  cache: cache.TtlCache<BatchedMacroScore>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedMacroScoreStore,
    cacheValue: cache.TtlCache<BatchedMacroScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedMacroScore | undefined {
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

  save(item: BatchedMacroScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedMacroScore[] {
    return this.inner.list();
  }
}

export function newCachedBatchedMacroScoreStore(inner: BatchedMacroScoreStore, ttl: number, clockValue: clock.Clock): BatchedMacroScoreStore {
  return new CachedBatchedMacroScoreStore(inner, cache.newTtlCache<BatchedMacroScore>(256, ttl, clockValue), 0, 0);
}

/** Selects batched macro scores. Empty fields match all. */
export class BatchedMacroScoreQuery {
  name: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minThreshold: number, statuses: string[], limit: number) {
    this.name = name;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedMacroScore): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedMacroScore[]): BatchedMacroScore[] {
    const matched = collections.filter(items, (candidate: BatchedMacroScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedMacroScores(store: BatchedMacroScoreStore, query: BatchedMacroScoreQuery): BatchedMacroScore[] {
  return query.apply(store.list());
}
