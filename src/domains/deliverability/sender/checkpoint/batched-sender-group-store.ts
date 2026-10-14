import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedSenderGroup } from "./batched-sender-group.js";

/** Keeps batched sender groups by code. */
export interface BatchedSenderGroupStore {
  find(code: string): BatchedSenderGroup | undefined;
  save(item: BatchedSenderGroup): void;
  remove(code: string): boolean;
  list(): BatchedSenderGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedSenderGroupStore implements BatchedSenderGroupStore {
  items: Map<string, BatchedSenderGroup>;
  order: string[];

  constructor(items: Map<string, BatchedSenderGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedSenderGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedSenderGroup): void {
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

  list(): BatchedSenderGroup[] {
    const out: BatchedSenderGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedSenderGroupStore(): BatchedSenderGroupStore {
  return new MemoryBatchedSenderGroupStore(new Map<string, BatchedSenderGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedSenderGroupStore implements BatchedSenderGroupStore {
  inner: BatchedSenderGroupStore;
  cache: cache.TtlCache<BatchedSenderGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedSenderGroupStore,
    cacheValue: cache.TtlCache<BatchedSenderGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedSenderGroup | undefined {
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

  save(item: BatchedSenderGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedSenderGroup[] {
    return this.inner.list();
  }
}

export function newCachedBatchedSenderGroupStore(inner: BatchedSenderGroupStore, ttl: number, clockValue: clock.Clock): BatchedSenderGroupStore {
  return new CachedBatchedSenderGroupStore(inner, cache.newTtlCache<BatchedSenderGroup>(512, ttl, clockValue), 0, 0);
}

/** Selects batched sender groups. Empty fields match all. */
export class BatchedSenderGroupQuery {
  name: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedSenderGroup): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedSenderGroup[]): BatchedSenderGroup[] {
    const matched = collections.filter(items, (candidate: BatchedSenderGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedSenderGroups(store: BatchedSenderGroupStore, query: BatchedSenderGroupQuery): BatchedSenderGroup[] {
  return query.apply(store.list());
}
