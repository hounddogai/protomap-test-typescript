import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryBounceBatch } from "./primary-bounce-batch.js";

/** Keeps primary bounce batches by code. */
export interface PrimaryBounceBatchStore {
  find(code: string): PrimaryBounceBatch | undefined;
  save(item: PrimaryBounceBatch): void;
  remove(code: string): boolean;
  list(): PrimaryBounceBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryBounceBatchStore implements PrimaryBounceBatchStore {
  items: Map<string, PrimaryBounceBatch>;
  order: string[];

  constructor(items: Map<string, PrimaryBounceBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryBounceBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryBounceBatch): void {
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

  list(): PrimaryBounceBatch[] {
    const out: PrimaryBounceBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryBounceBatchStore(): PrimaryBounceBatchStore {
  return new MemoryPrimaryBounceBatchStore(new Map<string, PrimaryBounceBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryBounceBatchStore implements PrimaryBounceBatchStore {
  inner: PrimaryBounceBatchStore;
  cache: cache.TtlCache<PrimaryBounceBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryBounceBatchStore,
    cacheValue: cache.TtlCache<PrimaryBounceBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryBounceBatch | undefined {
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

  save(item: PrimaryBounceBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryBounceBatch[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryBounceBatchStore(inner: PrimaryBounceBatchStore, ttl: number, clockValue: clock.Clock): PrimaryBounceBatchStore {
  return new CachedPrimaryBounceBatchStore(inner, cache.newTtlCache<PrimaryBounceBatch>(256, ttl, clockValue), 0, 0);
}

/** Selects primary bounce batches. Empty fields match all. */
export class PrimaryBounceBatchQuery {
  title: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minThreshold: number, statuses: string[], limit: number) {
    this.title = title;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryBounceBatch): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryBounceBatch[]): PrimaryBounceBatch[] {
    const matched = collections.filter(items, (candidate: PrimaryBounceBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryBounceBatches(store: PrimaryBounceBatchStore, query: PrimaryBounceBatchQuery): PrimaryBounceBatch[] {
  return query.apply(store.list());
}
