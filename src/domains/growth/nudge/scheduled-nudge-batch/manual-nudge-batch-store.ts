import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualNudgeBatch } from "./manual-nudge-batch.js";

/** Keeps manual nudge batches by code. */
export interface ManualNudgeBatchStore {
  find(code: string): ManualNudgeBatch | undefined;
  save(item: ManualNudgeBatch): void;
  remove(code: string): boolean;
  list(): ManualNudgeBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualNudgeBatchStore implements ManualNudgeBatchStore {
  items: Map<string, ManualNudgeBatch>;
  order: string[];

  constructor(items: Map<string, ManualNudgeBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualNudgeBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualNudgeBatch): void {
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

  list(): ManualNudgeBatch[] {
    const out: ManualNudgeBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualNudgeBatchStore(): ManualNudgeBatchStore {
  return new MemoryManualNudgeBatchStore(new Map<string, ManualNudgeBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualNudgeBatchStore implements ManualNudgeBatchStore {
  inner: ManualNudgeBatchStore;
  cache: cache.TtlCache<ManualNudgeBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualNudgeBatchStore,
    cacheValue: cache.TtlCache<ManualNudgeBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualNudgeBatch | undefined {
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

  save(item: ManualNudgeBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualNudgeBatch[] {
    return this.inner.list();
  }
}

export function newCachedManualNudgeBatchStore(inner: ManualNudgeBatchStore, ttl: number, clockValue: clock.Clock): ManualNudgeBatchStore {
  return new CachedManualNudgeBatchStore(inner, cache.newTtlCache<ManualNudgeBatch>(1024, ttl, clockValue), 0, 0);
}

/** Selects manual nudge batches. Empty fields match all. */
export class ManualNudgeBatchQuery {
  country: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minCeiling: number, statuses: string[], limit: number) {
    this.country = country;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualNudgeBatch): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualNudgeBatch[]): ManualNudgeBatch[] {
    const matched = collections.filter(items, (candidate: ManualNudgeBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualNudgeBatches(store: ManualNudgeBatchStore, query: ManualNudgeBatchQuery): ManualNudgeBatch[] {
  return query.apply(store.list());
}
