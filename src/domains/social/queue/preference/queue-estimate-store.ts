import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueEstimate } from "./queue-estimate.js";

/** Keeps queue estimates by code. */
export interface QueueEstimateStore {
  find(code: string): QueueEstimate | undefined;
  save(item: QueueEstimate): void;
  remove(code: string): boolean;
  list(): QueueEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueEstimateStore implements QueueEstimateStore {
  items: Map<string, QueueEstimate>;
  order: string[];

  constructor(items: Map<string, QueueEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueEstimate): void {
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

  list(): QueueEstimate[] {
    const out: QueueEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueEstimateStore(): QueueEstimateStore {
  return new MemoryQueueEstimateStore(new Map<string, QueueEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueEstimateStore implements QueueEstimateStore {
  inner: QueueEstimateStore;
  cache: cache.TtlCache<QueueEstimate>;
  hits: number;
  misses: number;

  constructor(inner: QueueEstimateStore, cacheValue: cache.TtlCache<QueueEstimate>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueEstimate | undefined {
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

  save(item: QueueEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueEstimate[] {
    return this.inner.list();
  }
}

export function newCachedQueueEstimateStore(inner: QueueEstimateStore, ttl: number, clockValue: clock.Clock): QueueEstimateStore {
  return new CachedQueueEstimateStore(inner, cache.newTtlCache<QueueEstimate>(1024, ttl, clockValue), 0, 0);
}

/** Selects queue estimates. Empty fields match all. */
export class QueueEstimateQuery {
  source: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minClicks: number, statuses: string[], limit: number) {
    this.source = source;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueEstimate): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueEstimate[]): QueueEstimate[] {
    const matched = collections.filter(items, (candidate: QueueEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueEstimates(store: QueueEstimateStore, query: QueueEstimateQuery): QueueEstimate[] {
  return query.apply(store.list());
}
