import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightBatch } from "./insight-batch.js";

/** Keeps insight batches by code. */
export interface InsightBatchStore {
  find(code: string): InsightBatch | undefined;
  save(item: InsightBatch): void;
  remove(code: string): boolean;
  list(): InsightBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightBatchStore implements InsightBatchStore {
  items: Map<string, InsightBatch>;
  order: string[];

  constructor(items: Map<string, InsightBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightBatch): void {
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

  list(): InsightBatch[] {
    const out: InsightBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightBatchStore(): InsightBatchStore {
  return new MemoryInsightBatchStore(new Map<string, InsightBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightBatchStore implements InsightBatchStore {
  inner: InsightBatchStore;
  cache: cache.TtlCache<InsightBatch>;
  hits: number;
  misses: number;

  constructor(inner: InsightBatchStore, cacheValue: cache.TtlCache<InsightBatch>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightBatch | undefined {
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

  save(item: InsightBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightBatch[] {
    return this.inner.list();
  }
}

export function newCachedInsightBatchStore(inner: InsightBatchStore, ttl: number, clockValue: clock.Clock): InsightBatchStore {
  return new CachedInsightBatchStore(inner, cache.newTtlCache<InsightBatch>(512, ttl, clockValue), 0, 0);
}

/** Selects insight batches. Empty fields match all. */
export class InsightBatchQuery {
  name: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minOpenRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightBatch): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightBatch[]): InsightBatch[] {
    const matched = collections.filter(items, (candidate: InsightBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightBatches(store: InsightBatchStore, query: InsightBatchQuery): InsightBatch[] {
  return query.apply(store.list());
}
