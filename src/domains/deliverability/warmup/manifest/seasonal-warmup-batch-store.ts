import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalWarmupBatch } from "./seasonal-warmup-batch.js";

/** Keeps seasonal warmup batches by code. */
export interface SeasonalWarmupBatchStore {
  find(code: string): SeasonalWarmupBatch | undefined;
  save(item: SeasonalWarmupBatch): void;
  remove(code: string): boolean;
  list(): SeasonalWarmupBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalWarmupBatchStore implements SeasonalWarmupBatchStore {
  items: Map<string, SeasonalWarmupBatch>;
  order: string[];

  constructor(items: Map<string, SeasonalWarmupBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalWarmupBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalWarmupBatch): void {
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

  list(): SeasonalWarmupBatch[] {
    const out: SeasonalWarmupBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalWarmupBatchStore(): SeasonalWarmupBatchStore {
  return new MemorySeasonalWarmupBatchStore(new Map<string, SeasonalWarmupBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalWarmupBatchStore implements SeasonalWarmupBatchStore {
  inner: SeasonalWarmupBatchStore;
  cache: cache.TtlCache<SeasonalWarmupBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalWarmupBatchStore,
    cacheValue: cache.TtlCache<SeasonalWarmupBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalWarmupBatch | undefined {
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

  save(item: SeasonalWarmupBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalWarmupBatch[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalWarmupBatchStore(inner: SeasonalWarmupBatchStore, ttl: number, clockValue: clock.Clock): SeasonalWarmupBatchStore {
  return new CachedSeasonalWarmupBatchStore(inner, cache.newTtlCache<SeasonalWarmupBatch>(128, ttl, clockValue), 0, 0);
}

/** Selects seasonal warmup batches. Empty fields match all. */
export class SeasonalWarmupBatchQuery {
  channel: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMargin: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalWarmupBatch): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalWarmupBatch[]): SeasonalWarmupBatch[] {
    const matched = collections.filter(items, (candidate: SeasonalWarmupBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalWarmupBatches(store: SeasonalWarmupBatchStore, query: SeasonalWarmupBatchQuery): SeasonalWarmupBatch[] {
  return query.apply(store.list());
}
