import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultRetentionBatch } from "./default-retention-batch.js";

/** Keeps default retention batches by code. */
export interface DefaultRetentionBatchStore {
  find(code: string): DefaultRetentionBatch | undefined;
  save(item: DefaultRetentionBatch): void;
  remove(code: string): boolean;
  list(): DefaultRetentionBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultRetentionBatchStore implements DefaultRetentionBatchStore {
  items: Map<string, DefaultRetentionBatch>;
  order: string[];

  constructor(items: Map<string, DefaultRetentionBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultRetentionBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultRetentionBatch): void {
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

  list(): DefaultRetentionBatch[] {
    const out: DefaultRetentionBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultRetentionBatchStore(): DefaultRetentionBatchStore {
  return new MemoryDefaultRetentionBatchStore(new Map<string, DefaultRetentionBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultRetentionBatchStore implements DefaultRetentionBatchStore {
  inner: DefaultRetentionBatchStore;
  cache: cache.TtlCache<DefaultRetentionBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultRetentionBatchStore,
    cacheValue: cache.TtlCache<DefaultRetentionBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultRetentionBatch | undefined {
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

  save(item: DefaultRetentionBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultRetentionBatch[] {
    return this.inner.list();
  }
}

export function newCachedDefaultRetentionBatchStore(inner: DefaultRetentionBatchStore, ttl: number, clockValue: clock.Clock): DefaultRetentionBatchStore {
  return new CachedDefaultRetentionBatchStore(
    inner,
    cache.newTtlCache<DefaultRetentionBatch>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default retention batches. Empty fields match all. */
export class DefaultRetentionBatchQuery {
  source: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minAttempts: number, statuses: string[], limit: number) {
    this.source = source;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultRetentionBatch): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultRetentionBatch[]): DefaultRetentionBatch[] {
    const matched = collections.filter(items, (candidate: DefaultRetentionBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultRetentionBatches(store: DefaultRetentionBatchStore, query: DefaultRetentionBatchQuery): DefaultRetentionBatch[] {
  return query.apply(store.list());
}
