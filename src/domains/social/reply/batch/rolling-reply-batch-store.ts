import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingReplyBatch } from "./rolling-reply-batch.js";

/** Keeps rolling reply batches by code. */
export interface RollingReplyBatchStore {
  find(code: string): RollingReplyBatch | undefined;
  save(item: RollingReplyBatch): void;
  remove(code: string): boolean;
  list(): RollingReplyBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingReplyBatchStore implements RollingReplyBatchStore {
  items: Map<string, RollingReplyBatch>;
  order: string[];

  constructor(items: Map<string, RollingReplyBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingReplyBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingReplyBatch): void {
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

  list(): RollingReplyBatch[] {
    const out: RollingReplyBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingReplyBatchStore(): RollingReplyBatchStore {
  return new MemoryRollingReplyBatchStore(new Map<string, RollingReplyBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingReplyBatchStore implements RollingReplyBatchStore {
  inner: RollingReplyBatchStore;
  cache: cache.TtlCache<RollingReplyBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingReplyBatchStore,
    cacheValue: cache.TtlCache<RollingReplyBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingReplyBatch | undefined {
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

  save(item: RollingReplyBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingReplyBatch[] {
    return this.inner.list();
  }
}

export function newCachedRollingReplyBatchStore(inner: RollingReplyBatchStore, ttl: number, clockValue: clock.Clock): RollingReplyBatchStore {
  return new CachedRollingReplyBatchStore(inner, cache.newTtlCache<RollingReplyBatch>(512, ttl, clockValue), 0, 0);
}

/** Selects rolling reply batches. Empty fields match all. */
export class RollingReplyBatchQuery {
  region: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minImpressions: number, statuses: string[], limit: number) {
    this.region = region;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingReplyBatch): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingReplyBatch[]): RollingReplyBatch[] {
    const matched = collections.filter(items, (candidate: RollingReplyBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingReplyBatches(store: RollingReplyBatchStore, query: RollingReplyBatchQuery): RollingReplyBatch[] {
  return query.apply(store.list());
}
