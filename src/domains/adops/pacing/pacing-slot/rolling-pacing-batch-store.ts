import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingPacingBatch } from "./rolling-pacing-batch.js";

/** Keeps rolling pacing batches by code. */
export interface RollingPacingBatchStore {
  find(code: string): RollingPacingBatch | undefined;
  save(item: RollingPacingBatch): void;
  remove(code: string): boolean;
  list(): RollingPacingBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingPacingBatchStore implements RollingPacingBatchStore {
  items: Map<string, RollingPacingBatch>;
  order: string[];

  constructor(items: Map<string, RollingPacingBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingPacingBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingPacingBatch): void {
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

  list(): RollingPacingBatch[] {
    const out: RollingPacingBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingPacingBatchStore(): RollingPacingBatchStore {
  return new MemoryRollingPacingBatchStore(new Map<string, RollingPacingBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingPacingBatchStore implements RollingPacingBatchStore {
  inner: RollingPacingBatchStore;
  cache: cache.TtlCache<RollingPacingBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingPacingBatchStore,
    cacheValue: cache.TtlCache<RollingPacingBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingPacingBatch | undefined {
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

  save(item: RollingPacingBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingPacingBatch[] {
    return this.inner.list();
  }
}

export function newCachedRollingPacingBatchStore(inner: RollingPacingBatchStore, ttl: number, clockValue: clock.Clock): RollingPacingBatchStore {
  return new CachedRollingPacingBatchStore(inner, cache.newTtlCache<RollingPacingBatch>(128, ttl, clockValue), 0, 0);
}

/** Selects rolling pacing batches. Empty fields match all. */
export class RollingPacingBatchQuery {
  name: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMaximum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingPacingBatch): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingPacingBatch[]): RollingPacingBatch[] {
    const matched = collections.filter(items, (candidate: RollingPacingBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingPacingBatches(store: RollingPacingBatchStore, query: RollingPacingBatchQuery): RollingPacingBatch[] {
  return query.apply(store.list());
}
