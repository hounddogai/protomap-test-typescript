import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingBatch } from "./pacing-batch.js";

/** Keeps pacing batches by code. */
export interface PacingBatchStore {
  find(code: string): PacingBatch | undefined;
  save(item: PacingBatch): void;
  remove(code: string): boolean;
  list(): PacingBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingBatchStore implements PacingBatchStore {
  items: Map<string, PacingBatch>;
  order: string[];

  constructor(items: Map<string, PacingBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingBatch): void {
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

  list(): PacingBatch[] {
    const out: PacingBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingBatchStore(): PacingBatchStore {
  return new MemoryPacingBatchStore(new Map<string, PacingBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingBatchStore implements PacingBatchStore {
  inner: PacingBatchStore;
  cache: cache.TtlCache<PacingBatch>;
  hits: number;
  misses: number;

  constructor(inner: PacingBatchStore, cacheValue: cache.TtlCache<PacingBatch>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingBatch | undefined {
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

  save(item: PacingBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingBatch[] {
    return this.inner.list();
  }
}

export function newCachedPacingBatchStore(inner: PacingBatchStore, ttl: number, clockValue: clock.Clock): PacingBatchStore {
  return new CachedPacingBatchStore(inner, cache.newTtlCache<PacingBatch>(256, ttl, clockValue), 0, 0);
}

/** Selects pacing batches. Empty fields match all. */
export class PacingBatchQuery {
  name: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minImpressions: number, statuses: string[], limit: number) {
    this.name = name;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingBatch): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingBatch[]): PacingBatch[] {
    const matched = collections.filter(items, (candidate: PacingBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingBatches(store: PacingBatchStore, query: PacingBatchQuery): PacingBatch[] {
  return query.apply(store.list());
}
