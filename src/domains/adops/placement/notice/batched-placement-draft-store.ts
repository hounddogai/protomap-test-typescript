import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedPlacementDraft } from "./batched-placement-draft.js";

/** Keeps batched placement drafts by code. */
export interface BatchedPlacementDraftStore {
  find(code: string): BatchedPlacementDraft | undefined;
  save(item: BatchedPlacementDraft): void;
  remove(code: string): boolean;
  list(): BatchedPlacementDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedPlacementDraftStore implements BatchedPlacementDraftStore {
  items: Map<string, BatchedPlacementDraft>;
  order: string[];

  constructor(items: Map<string, BatchedPlacementDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedPlacementDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedPlacementDraft): void {
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

  list(): BatchedPlacementDraft[] {
    const out: BatchedPlacementDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedPlacementDraftStore(): BatchedPlacementDraftStore {
  return new MemoryBatchedPlacementDraftStore(new Map<string, BatchedPlacementDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedPlacementDraftStore implements BatchedPlacementDraftStore {
  inner: BatchedPlacementDraftStore;
  cache: cache.TtlCache<BatchedPlacementDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedPlacementDraftStore,
    cacheValue: cache.TtlCache<BatchedPlacementDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedPlacementDraft | undefined {
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

  save(item: BatchedPlacementDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedPlacementDraft[] {
    return this.inner.list();
  }
}

export function newCachedBatchedPlacementDraftStore(inner: BatchedPlacementDraftStore, ttl: number, clockValue: clock.Clock): BatchedPlacementDraftStore {
  return new CachedBatchedPlacementDraftStore(
    inner,
    cache.newTtlCache<BatchedPlacementDraft>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched placement drafts. Empty fields match all. */
export class BatchedPlacementDraftQuery {
  channel: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minGraceDays: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedPlacementDraft): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedPlacementDraft[]): BatchedPlacementDraft[] {
    const matched = collections.filter(items, (candidate: BatchedPlacementDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedPlacementDrafts(store: BatchedPlacementDraftStore, query: BatchedPlacementDraftQuery): BatchedPlacementDraft[] {
  return query.apply(store.list());
}
