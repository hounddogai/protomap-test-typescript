import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditBatch } from "./credit-batch.js";

/** Keeps credit batches by code. */
export interface CreditBatchStore {
  find(code: string): CreditBatch | undefined;
  save(item: CreditBatch): void;
  remove(code: string): boolean;
  list(): CreditBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditBatchStore implements CreditBatchStore {
  items: Map<string, CreditBatch>;
  order: string[];

  constructor(items: Map<string, CreditBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditBatch): void {
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

  list(): CreditBatch[] {
    const out: CreditBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditBatchStore(): CreditBatchStore {
  return new MemoryCreditBatchStore(new Map<string, CreditBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditBatchStore implements CreditBatchStore {
  inner: CreditBatchStore;
  cache: cache.TtlCache<CreditBatch>;
  hits: number;
  misses: number;

  constructor(inner: CreditBatchStore, cacheValue: cache.TtlCache<CreditBatch>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditBatch | undefined {
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

  save(item: CreditBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditBatch[] {
    return this.inner.list();
  }
}

export function newCachedCreditBatchStore(inner: CreditBatchStore, ttl: number, clockValue: clock.Clock): CreditBatchStore {
  return new CachedCreditBatchStore(inner, cache.newTtlCache<CreditBatch>(512, ttl, clockValue), 0, 0);
}

/** Selects credit batches. Empty fields match all. */
export class CreditBatchQuery {
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

  matches(item: CreditBatch): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditBatch[]): CreditBatch[] {
    const matched = collections.filter(items, (candidate: CreditBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditBatches(store: CreditBatchStore, query: CreditBatchQuery): CreditBatch[] {
  return query.apply(store.list());
}
