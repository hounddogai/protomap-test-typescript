import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedApprovalGroup } from "./batched-approval-group.js";

/** Keeps batched approval groups by code. */
export interface BatchedApprovalGroupStore {
  find(code: string): BatchedApprovalGroup | undefined;
  save(item: BatchedApprovalGroup): void;
  remove(code: string): boolean;
  list(): BatchedApprovalGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedApprovalGroupStore implements BatchedApprovalGroupStore {
  items: Map<string, BatchedApprovalGroup>;
  order: string[];

  constructor(items: Map<string, BatchedApprovalGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedApprovalGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedApprovalGroup): void {
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

  list(): BatchedApprovalGroup[] {
    const out: BatchedApprovalGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedApprovalGroupStore(): BatchedApprovalGroupStore {
  return new MemoryBatchedApprovalGroupStore(new Map<string, BatchedApprovalGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedApprovalGroupStore implements BatchedApprovalGroupStore {
  inner: BatchedApprovalGroupStore;
  cache: cache.TtlCache<BatchedApprovalGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedApprovalGroupStore,
    cacheValue: cache.TtlCache<BatchedApprovalGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedApprovalGroup | undefined {
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

  save(item: BatchedApprovalGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedApprovalGroup[] {
    return this.inner.list();
  }
}

export function newCachedBatchedApprovalGroupStore(inner: BatchedApprovalGroupStore, ttl: number, clockValue: clock.Clock): BatchedApprovalGroupStore {
  return new CachedBatchedApprovalGroupStore(
    inner,
    cache.newTtlCache<BatchedApprovalGroup>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched approval groups. Empty fields match all. */
export class BatchedApprovalGroupQuery {
  locale: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minPriority: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedApprovalGroup): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedApprovalGroup[]): BatchedApprovalGroup[] {
    const matched = collections.filter(items, (candidate: BatchedApprovalGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedApprovalGroups(store: BatchedApprovalGroupStore, query: BatchedApprovalGroupQuery): BatchedApprovalGroup[] {
  return query.apply(store.list());
}
