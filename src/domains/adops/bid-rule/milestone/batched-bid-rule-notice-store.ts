import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedBidRuleNotice } from "./batched-bid-rule-notice.js";

/** Keeps batched bid rule notices by code. */
export interface BatchedBidRuleNoticeStore {
  find(code: string): BatchedBidRuleNotice | undefined;
  save(item: BatchedBidRuleNotice): void;
  remove(code: string): boolean;
  list(): BatchedBidRuleNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedBidRuleNoticeStore implements BatchedBidRuleNoticeStore {
  items: Map<string, BatchedBidRuleNotice>;
  order: string[];

  constructor(items: Map<string, BatchedBidRuleNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedBidRuleNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedBidRuleNotice): void {
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

  list(): BatchedBidRuleNotice[] {
    const out: BatchedBidRuleNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedBidRuleNoticeStore(): BatchedBidRuleNoticeStore {
  return new MemoryBatchedBidRuleNoticeStore(new Map<string, BatchedBidRuleNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedBidRuleNoticeStore implements BatchedBidRuleNoticeStore {
  inner: BatchedBidRuleNoticeStore;
  cache: cache.TtlCache<BatchedBidRuleNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedBidRuleNoticeStore,
    cacheValue: cache.TtlCache<BatchedBidRuleNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedBidRuleNotice | undefined {
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

  save(item: BatchedBidRuleNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedBidRuleNotice[] {
    return this.inner.list();
  }
}

export function newCachedBatchedBidRuleNoticeStore(inner: BatchedBidRuleNoticeStore, ttl: number, clockValue: clock.Clock): BatchedBidRuleNoticeStore {
  return new CachedBatchedBidRuleNoticeStore(inner, cache.newTtlCache<BatchedBidRuleNotice>(64, ttl, clockValue), 0, 0);
}

/** Selects batched bid rule notices. Empty fields match all. */
export class BatchedBidRuleNoticeQuery {
  title: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minClicks: number, statuses: string[], limit: number) {
    this.title = title;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedBidRuleNotice): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedBidRuleNotice[]): BatchedBidRuleNotice[] {
    const matched = collections.filter(items, (candidate: BatchedBidRuleNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedBidRuleNotices(store: BatchedBidRuleNoticeStore, query: BatchedBidRuleNoticeQuery): BatchedBidRuleNotice[] {
  return query.apply(store.list());
}
