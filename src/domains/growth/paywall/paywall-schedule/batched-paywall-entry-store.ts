import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedPaywallEntry } from "./batched-paywall-entry.js";

/** Keeps batched paywall entries by code. */
export interface BatchedPaywallEntryStore {
  find(code: string): BatchedPaywallEntry | undefined;
  save(item: BatchedPaywallEntry): void;
  remove(code: string): boolean;
  list(): BatchedPaywallEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedPaywallEntryStore implements BatchedPaywallEntryStore {
  items: Map<string, BatchedPaywallEntry>;
  order: string[];

  constructor(items: Map<string, BatchedPaywallEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedPaywallEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedPaywallEntry): void {
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

  list(): BatchedPaywallEntry[] {
    const out: BatchedPaywallEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedPaywallEntryStore(): BatchedPaywallEntryStore {
  return new MemoryBatchedPaywallEntryStore(new Map<string, BatchedPaywallEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedPaywallEntryStore implements BatchedPaywallEntryStore {
  inner: BatchedPaywallEntryStore;
  cache: cache.TtlCache<BatchedPaywallEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedPaywallEntryStore,
    cacheValue: cache.TtlCache<BatchedPaywallEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedPaywallEntry | undefined {
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

  save(item: BatchedPaywallEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedPaywallEntry[] {
    return this.inner.list();
  }
}

export function newCachedBatchedPaywallEntryStore(inner: BatchedPaywallEntryStore, ttl: number, clockValue: clock.Clock): BatchedPaywallEntryStore {
  return new CachedBatchedPaywallEntryStore(inner, cache.newTtlCache<BatchedPaywallEntry>(128, ttl, clockValue), 0, 0);
}

/** Selects batched paywall entries. Empty fields match all. */
export class BatchedPaywallEntryQuery {
  source: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minMinimum: number, statuses: string[], limit: number) {
    this.source = source;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedPaywallEntry): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedPaywallEntry[]): BatchedPaywallEntry[] {
    const matched = collections.filter(items, (candidate: BatchedPaywallEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedPaywallEntries(store: BatchedPaywallEntryStore, query: BatchedPaywallEntryQuery): BatchedPaywallEntry[] {
  return query.apply(store.list());
}
