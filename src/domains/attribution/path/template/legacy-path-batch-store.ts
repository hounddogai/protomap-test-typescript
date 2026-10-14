import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyPathBatch } from "./legacy-path-batch.js";

/** Keeps legacy path batches by code. */
export interface LegacyPathBatchStore {
  find(code: string): LegacyPathBatch | undefined;
  save(item: LegacyPathBatch): void;
  remove(code: string): boolean;
  list(): LegacyPathBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyPathBatchStore implements LegacyPathBatchStore {
  items: Map<string, LegacyPathBatch>;
  order: string[];

  constructor(items: Map<string, LegacyPathBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyPathBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyPathBatch): void {
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

  list(): LegacyPathBatch[] {
    const out: LegacyPathBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyPathBatchStore(): LegacyPathBatchStore {
  return new MemoryLegacyPathBatchStore(new Map<string, LegacyPathBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyPathBatchStore implements LegacyPathBatchStore {
  inner: LegacyPathBatchStore;
  cache: cache.TtlCache<LegacyPathBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyPathBatchStore,
    cacheValue: cache.TtlCache<LegacyPathBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyPathBatch | undefined {
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

  save(item: LegacyPathBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyPathBatch[] {
    return this.inner.list();
  }
}

export function newCachedLegacyPathBatchStore(inner: LegacyPathBatchStore, ttl: number, clockValue: clock.Clock): LegacyPathBatchStore {
  return new CachedLegacyPathBatchStore(inner, cache.newTtlCache<LegacyPathBatch>(512, ttl, clockValue), 0, 0);
}

/** Selects legacy path batches. Empty fields match all. */
export class LegacyPathBatchQuery {
  segment: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minOpenRate: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyPathBatch): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyPathBatch[]): LegacyPathBatch[] {
    const matched = collections.filter(items, (candidate: LegacyPathBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyPathBatches(store: LegacyPathBatchStore, query: LegacyPathBatchQuery): LegacyPathBatch[] {
  return query.apply(store.list());
}
