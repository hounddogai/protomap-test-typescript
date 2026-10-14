import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationBatch } from "./activation-batch.js";

/** Keeps activation batches by code. */
export interface ActivationBatchStore {
  find(code: string): ActivationBatch | undefined;
  save(item: ActivationBatch): void;
  remove(code: string): boolean;
  list(): ActivationBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationBatchStore implements ActivationBatchStore {
  items: Map<string, ActivationBatch>;
  order: string[];

  constructor(items: Map<string, ActivationBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationBatch): void {
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

  list(): ActivationBatch[] {
    const out: ActivationBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationBatchStore(): ActivationBatchStore {
  return new MemoryActivationBatchStore(new Map<string, ActivationBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationBatchStore implements ActivationBatchStore {
  inner: ActivationBatchStore;
  cache: cache.TtlCache<ActivationBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationBatchStore,
    cacheValue: cache.TtlCache<ActivationBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationBatch | undefined {
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

  save(item: ActivationBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationBatch[] {
    return this.inner.list();
  }
}

export function newCachedActivationBatchStore(inner: ActivationBatchStore, ttl: number, clockValue: clock.Clock): ActivationBatchStore {
  return new CachedActivationBatchStore(inner, cache.newTtlCache<ActivationBatch>(512, ttl, clockValue), 0, 0);
}

/** Selects activation batches. Empty fields match all. */
export class ActivationBatchQuery {
  unit: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minDiscount: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ActivationBatch): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationBatch[]): ActivationBatch[] {
    const matched = collections.filter(items, (candidate: ActivationBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationBatches(store: ActivationBatchStore, query: ActivationBatchQuery): ActivationBatch[] {
  return query.apply(store.list());
}
