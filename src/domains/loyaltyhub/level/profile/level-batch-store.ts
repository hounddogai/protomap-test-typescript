import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LevelBatch } from "./level-batch.js";

/** Keeps level batches by code. */
export interface LevelBatchStore {
  find(code: string): LevelBatch | undefined;
  save(item: LevelBatch): void;
  remove(code: string): boolean;
  list(): LevelBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLevelBatchStore implements LevelBatchStore {
  items: Map<string, LevelBatch>;
  order: string[];

  constructor(items: Map<string, LevelBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LevelBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LevelBatch): void {
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

  list(): LevelBatch[] {
    const out: LevelBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLevelBatchStore(): LevelBatchStore {
  return new MemoryLevelBatchStore(new Map<string, LevelBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLevelBatchStore implements LevelBatchStore {
  inner: LevelBatchStore;
  cache: cache.TtlCache<LevelBatch>;
  hits: number;
  misses: number;

  constructor(inner: LevelBatchStore, cacheValue: cache.TtlCache<LevelBatch>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LevelBatch | undefined {
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

  save(item: LevelBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LevelBatch[] {
    return this.inner.list();
  }
}

export function newCachedLevelBatchStore(inner: LevelBatchStore, ttl: number, clockValue: clock.Clock): LevelBatchStore {
  return new CachedLevelBatchStore(inner, cache.newTtlCache<LevelBatch>(128, ttl, clockValue), 0, 0);
}

/** Selects level batches. Empty fields match all. */
export class LevelBatchQuery {
  label: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minGraceDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LevelBatch): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LevelBatch[]): LevelBatch[] {
    const matched = collections.filter(items, (candidate: LevelBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLevelBatches(store: LevelBatchStore, query: LevelBatchQuery): LevelBatch[] {
  return query.apply(store.list());
}
