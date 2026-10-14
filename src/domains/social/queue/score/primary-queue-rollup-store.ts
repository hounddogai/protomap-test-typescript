import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryQueueRollup } from "./primary-queue-rollup.js";

/** Keeps primary queue rollups by code. */
export interface PrimaryQueueRollupStore {
  find(code: string): PrimaryQueueRollup | undefined;
  save(item: PrimaryQueueRollup): void;
  remove(code: string): boolean;
  list(): PrimaryQueueRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryQueueRollupStore implements PrimaryQueueRollupStore {
  items: Map<string, PrimaryQueueRollup>;
  order: string[];

  constructor(items: Map<string, PrimaryQueueRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryQueueRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryQueueRollup): void {
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

  list(): PrimaryQueueRollup[] {
    const out: PrimaryQueueRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryQueueRollupStore(): PrimaryQueueRollupStore {
  return new MemoryPrimaryQueueRollupStore(new Map<string, PrimaryQueueRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryQueueRollupStore implements PrimaryQueueRollupStore {
  inner: PrimaryQueueRollupStore;
  cache: cache.TtlCache<PrimaryQueueRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryQueueRollupStore,
    cacheValue: cache.TtlCache<PrimaryQueueRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryQueueRollup | undefined {
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

  save(item: PrimaryQueueRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryQueueRollup[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryQueueRollupStore(inner: PrimaryQueueRollupStore, ttl: number, clockValue: clock.Clock): PrimaryQueueRollupStore {
  return new CachedPrimaryQueueRollupStore(inner, cache.newTtlCache<PrimaryQueueRollup>(512, ttl, clockValue), 0, 0);
}

/** Selects primary queue rollups. Empty fields match all. */
export class PrimaryQueueRollupQuery {
  title: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRetries: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryQueueRollup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryQueueRollup[]): PrimaryQueueRollup[] {
    const matched = collections.filter(items, (candidate: PrimaryQueueRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryQueueRollups(store: PrimaryQueueRollupStore, query: PrimaryQueueRollupQuery): PrimaryQueueRollup[] {
  return query.apply(store.list());
}
