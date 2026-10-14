import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalSenderBatch } from "./regional-sender-batch.js";

/** Keeps regional sender batches by code. */
export interface RegionalSenderBatchStore {
  find(code: string): RegionalSenderBatch | undefined;
  save(item: RegionalSenderBatch): void;
  remove(code: string): boolean;
  list(): RegionalSenderBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalSenderBatchStore implements RegionalSenderBatchStore {
  items: Map<string, RegionalSenderBatch>;
  order: string[];

  constructor(items: Map<string, RegionalSenderBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalSenderBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalSenderBatch): void {
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

  list(): RegionalSenderBatch[] {
    const out: RegionalSenderBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalSenderBatchStore(): RegionalSenderBatchStore {
  return new MemoryRegionalSenderBatchStore(new Map<string, RegionalSenderBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalSenderBatchStore implements RegionalSenderBatchStore {
  inner: RegionalSenderBatchStore;
  cache: cache.TtlCache<RegionalSenderBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalSenderBatchStore,
    cacheValue: cache.TtlCache<RegionalSenderBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalSenderBatch | undefined {
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

  save(item: RegionalSenderBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalSenderBatch[] {
    return this.inner.list();
  }
}

export function newCachedRegionalSenderBatchStore(inner: RegionalSenderBatchStore, ttl: number, clockValue: clock.Clock): RegionalSenderBatchStore {
  return new CachedRegionalSenderBatchStore(inner, cache.newTtlCache<RegionalSenderBatch>(256, ttl, clockValue), 0, 0);
}

/** Selects regional sender batches. Empty fields match all. */
export class RegionalSenderBatchQuery {
  label: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minLimit: number, statuses: string[], limit: number) {
    this.label = label;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalSenderBatch): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalSenderBatch[]): RegionalSenderBatch[] {
    const matched = collections.filter(items, (candidate: RegionalSenderBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalSenderBatches(store: RegionalSenderBatchStore, query: RegionalSenderBatchQuery): RegionalSenderBatch[] {
  return query.apply(store.list());
}
