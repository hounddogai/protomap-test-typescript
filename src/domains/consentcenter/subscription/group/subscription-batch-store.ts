import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionBatch } from "./subscription-batch.js";

/** Keeps subscription batches by code. */
export interface SubscriptionBatchStore {
  find(code: string): SubscriptionBatch | undefined;
  save(item: SubscriptionBatch): void;
  remove(code: string): boolean;
  list(): SubscriptionBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionBatchStore implements SubscriptionBatchStore {
  items: Map<string, SubscriptionBatch>;
  order: string[];

  constructor(items: Map<string, SubscriptionBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionBatch): void {
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

  list(): SubscriptionBatch[] {
    const out: SubscriptionBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionBatchStore(): SubscriptionBatchStore {
  return new MemorySubscriptionBatchStore(new Map<string, SubscriptionBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionBatchStore implements SubscriptionBatchStore {
  inner: SubscriptionBatchStore;
  cache: cache.TtlCache<SubscriptionBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionBatchStore,
    cacheValue: cache.TtlCache<SubscriptionBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionBatch | undefined {
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

  save(item: SubscriptionBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionBatch[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionBatchStore(inner: SubscriptionBatchStore, ttl: number, clockValue: clock.Clock): SubscriptionBatchStore {
  return new CachedSubscriptionBatchStore(inner, cache.newTtlCache<SubscriptionBatch>(512, ttl, clockValue), 0, 0);
}

/** Selects subscription batches. Empty fields match all. */
export class SubscriptionBatchQuery {
  channel: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minWeight: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionBatch): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionBatch[]): SubscriptionBatch[] {
    const matched = collections.filter(items, (candidate: SubscriptionBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionBatches(store: SubscriptionBatchStore, query: SubscriptionBatchQuery): SubscriptionBatch[] {
  return query.apply(store.list());
}
