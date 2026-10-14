import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedFlightDraft } from "./batched-flight-draft.js";

/** Keeps batched flight drafts by code. */
export interface BatchedFlightDraftStore {
  find(code: string): BatchedFlightDraft | undefined;
  save(item: BatchedFlightDraft): void;
  remove(code: string): boolean;
  list(): BatchedFlightDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedFlightDraftStore implements BatchedFlightDraftStore {
  items: Map<string, BatchedFlightDraft>;
  order: string[];

  constructor(items: Map<string, BatchedFlightDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedFlightDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedFlightDraft): void {
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

  list(): BatchedFlightDraft[] {
    const out: BatchedFlightDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedFlightDraftStore(): BatchedFlightDraftStore {
  return new MemoryBatchedFlightDraftStore(new Map<string, BatchedFlightDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedFlightDraftStore implements BatchedFlightDraftStore {
  inner: BatchedFlightDraftStore;
  cache: cache.TtlCache<BatchedFlightDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedFlightDraftStore,
    cacheValue: cache.TtlCache<BatchedFlightDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedFlightDraft | undefined {
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

  save(item: BatchedFlightDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedFlightDraft[] {
    return this.inner.list();
  }
}

export function newCachedBatchedFlightDraftStore(inner: BatchedFlightDraftStore, ttl: number, clockValue: clock.Clock): BatchedFlightDraftStore {
  return new CachedBatchedFlightDraftStore(inner, cache.newTtlCache<BatchedFlightDraft>(128, ttl, clockValue), 0, 0);
}

/** Selects batched flight drafts. Empty fields match all. */
export class BatchedFlightDraftQuery {
  utmSource: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minWeight: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedFlightDraft): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedFlightDraft[]): BatchedFlightDraft[] {
    const matched = collections.filter(items, (candidate: BatchedFlightDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedFlightDrafts(store: BatchedFlightDraftStore, query: BatchedFlightDraftQuery): BatchedFlightDraft[] {
  return query.apply(store.list());
}
