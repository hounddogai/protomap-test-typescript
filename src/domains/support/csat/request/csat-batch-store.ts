import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatBatch } from "./csat-batch.js";

/** Keeps csat batches by code. */
export interface CsatBatchStore {
  find(code: string): CsatBatch | undefined;
  save(item: CsatBatch): void;
  remove(code: string): boolean;
  list(): CsatBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatBatchStore implements CsatBatchStore {
  items: Map<string, CsatBatch>;
  order: string[];

  constructor(items: Map<string, CsatBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatBatch): void {
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

  list(): CsatBatch[] {
    const out: CsatBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatBatchStore(): CsatBatchStore {
  return new MemoryCsatBatchStore(new Map<string, CsatBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatBatchStore implements CsatBatchStore {
  inner: CsatBatchStore;
  cache: cache.TtlCache<CsatBatch>;
  hits: number;
  misses: number;

  constructor(inner: CsatBatchStore, cacheValue: cache.TtlCache<CsatBatch>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatBatch | undefined {
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

  save(item: CsatBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatBatch[] {
    return this.inner.list();
  }
}

export function newCachedCsatBatchStore(inner: CsatBatchStore, ttl: number, clockValue: clock.Clock): CsatBatchStore {
  return new CachedCsatBatchStore(inner, cache.newTtlCache<CsatBatch>(512, ttl, clockValue), 0, 0);
}

/** Selects csat batches. Empty fields match all. */
export class CsatBatchQuery {
  name: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minClicks: number, statuses: string[], limit: number) {
    this.name = name;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatBatch): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatBatch[]): CsatBatch[] {
    const matched = collections.filter(items, (candidate: CsatBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatBatches(store: CsatBatchStore, query: CsatBatchQuery): CsatBatch[] {
  return query.apply(store.list());
}
