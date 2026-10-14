import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalFrequencyBatch } from "./regional-frequency-batch.js";

/** Keeps regional frequency batches by code. */
export interface RegionalFrequencyBatchStore {
  find(code: string): RegionalFrequencyBatch | undefined;
  save(item: RegionalFrequencyBatch): void;
  remove(code: string): boolean;
  list(): RegionalFrequencyBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalFrequencyBatchStore implements RegionalFrequencyBatchStore {
  items: Map<string, RegionalFrequencyBatch>;
  order: string[];

  constructor(items: Map<string, RegionalFrequencyBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalFrequencyBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalFrequencyBatch): void {
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

  list(): RegionalFrequencyBatch[] {
    const out: RegionalFrequencyBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalFrequencyBatchStore(): RegionalFrequencyBatchStore {
  return new MemoryRegionalFrequencyBatchStore(new Map<string, RegionalFrequencyBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalFrequencyBatchStore implements RegionalFrequencyBatchStore {
  inner: RegionalFrequencyBatchStore;
  cache: cache.TtlCache<RegionalFrequencyBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalFrequencyBatchStore,
    cacheValue: cache.TtlCache<RegionalFrequencyBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalFrequencyBatch | undefined {
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

  save(item: RegionalFrequencyBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalFrequencyBatch[] {
    return this.inner.list();
  }
}

export function newCachedRegionalFrequencyBatchStore(inner: RegionalFrequencyBatchStore, ttl: number, clockValue: clock.Clock): RegionalFrequencyBatchStore {
  return new CachedRegionalFrequencyBatchStore(
    inner,
    cache.newTtlCache<RegionalFrequencyBatch>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional frequency batches. Empty fields match all. */
export class RegionalFrequencyBatchQuery {
  name: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minGraceDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalFrequencyBatch): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalFrequencyBatch[]): RegionalFrequencyBatch[] {
    const matched = collections.filter(items, (candidate: RegionalFrequencyBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalFrequencyBatches(store: RegionalFrequencyBatchStore, query: RegionalFrequencyBatchQuery): RegionalFrequencyBatch[] {
  return query.apply(store.list());
}
