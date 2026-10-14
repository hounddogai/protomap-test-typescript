import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualChallengeBatch } from "./manual-challenge-batch.js";

/** Keeps manual challenge batches by code. */
export interface ManualChallengeBatchStore {
  find(code: string): ManualChallengeBatch | undefined;
  save(item: ManualChallengeBatch): void;
  remove(code: string): boolean;
  list(): ManualChallengeBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualChallengeBatchStore implements ManualChallengeBatchStore {
  items: Map<string, ManualChallengeBatch>;
  order: string[];

  constructor(items: Map<string, ManualChallengeBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualChallengeBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualChallengeBatch): void {
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

  list(): ManualChallengeBatch[] {
    const out: ManualChallengeBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualChallengeBatchStore(): ManualChallengeBatchStore {
  return new MemoryManualChallengeBatchStore(new Map<string, ManualChallengeBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualChallengeBatchStore implements ManualChallengeBatchStore {
  inner: ManualChallengeBatchStore;
  cache: cache.TtlCache<ManualChallengeBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualChallengeBatchStore,
    cacheValue: cache.TtlCache<ManualChallengeBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualChallengeBatch | undefined {
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

  save(item: ManualChallengeBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualChallengeBatch[] {
    return this.inner.list();
  }
}

export function newCachedManualChallengeBatchStore(inner: ManualChallengeBatchStore, ttl: number, clockValue: clock.Clock): ManualChallengeBatchStore {
  return new CachedManualChallengeBatchStore(inner, cache.newTtlCache<ManualChallengeBatch>(64, ttl, clockValue), 0, 0);
}

/** Selects manual challenge batches. Empty fields match all. */
export class ManualChallengeBatchQuery {
  title: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCapacity: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualChallengeBatch): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualChallengeBatch[]): ManualChallengeBatch[] {
    const matched = collections.filter(items, (candidate: ManualChallengeBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualChallengeBatches(store: ManualChallengeBatchStore, query: ManualChallengeBatchQuery): ManualChallengeBatch[] {
  return query.apply(store.list());
}
