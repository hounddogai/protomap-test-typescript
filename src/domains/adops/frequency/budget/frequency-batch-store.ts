import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencyBatch } from "./frequency-batch.js";

/** Keeps frequency batches by code. */
export interface FrequencyBatchStore {
  find(code: string): FrequencyBatch | undefined;
  save(item: FrequencyBatch): void;
  remove(code: string): boolean;
  list(): FrequencyBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencyBatchStore implements FrequencyBatchStore {
  items: Map<string, FrequencyBatch>;
  order: string[];

  constructor(items: Map<string, FrequencyBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencyBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencyBatch): void {
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

  list(): FrequencyBatch[] {
    const out: FrequencyBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencyBatchStore(): FrequencyBatchStore {
  return new MemoryFrequencyBatchStore(new Map<string, FrequencyBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencyBatchStore implements FrequencyBatchStore {
  inner: FrequencyBatchStore;
  cache: cache.TtlCache<FrequencyBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: FrequencyBatchStore,
    cacheValue: cache.TtlCache<FrequencyBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencyBatch | undefined {
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

  save(item: FrequencyBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencyBatch[] {
    return this.inner.list();
  }
}

export function newCachedFrequencyBatchStore(inner: FrequencyBatchStore, ttl: number, clockValue: clock.Clock): FrequencyBatchStore {
  return new CachedFrequencyBatchStore(inner, cache.newTtlCache<FrequencyBatch>(512, ttl, clockValue), 0, 0);
}

/** Selects frequency batches. Empty fields match all. */
export class FrequencyBatchQuery {
  label: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minQuantity: number, statuses: string[], limit: number) {
    this.label = label;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencyBatch): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencyBatch[]): FrequencyBatch[] {
    const matched = collections.filter(items, (candidate: FrequencyBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencyBatches(store: FrequencyBatchStore, query: FrequencyBatchQuery): FrequencyBatch[] {
  return query.apply(store.list());
}
