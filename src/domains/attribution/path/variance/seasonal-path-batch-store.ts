import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalPathBatch } from "./seasonal-path-batch.js";

/** Keeps seasonal path batches by code. */
export interface SeasonalPathBatchStore {
  find(code: string): SeasonalPathBatch | undefined;
  save(item: SeasonalPathBatch): void;
  remove(code: string): boolean;
  list(): SeasonalPathBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalPathBatchStore implements SeasonalPathBatchStore {
  items: Map<string, SeasonalPathBatch>;
  order: string[];

  constructor(items: Map<string, SeasonalPathBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalPathBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalPathBatch): void {
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

  list(): SeasonalPathBatch[] {
    const out: SeasonalPathBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalPathBatchStore(): SeasonalPathBatchStore {
  return new MemorySeasonalPathBatchStore(new Map<string, SeasonalPathBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalPathBatchStore implements SeasonalPathBatchStore {
  inner: SeasonalPathBatchStore;
  cache: cache.TtlCache<SeasonalPathBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalPathBatchStore,
    cacheValue: cache.TtlCache<SeasonalPathBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalPathBatch | undefined {
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

  save(item: SeasonalPathBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalPathBatch[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalPathBatchStore(inner: SeasonalPathBatchStore, ttl: number, clockValue: clock.Clock): SeasonalPathBatchStore {
  return new CachedSeasonalPathBatchStore(inner, cache.newTtlCache<SeasonalPathBatch>(64, ttl, clockValue), 0, 0);
}

/** Selects seasonal path batches. Empty fields match all. */
export class SeasonalPathBatchQuery {
  label: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMaximum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalPathBatch): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalPathBatch[]): SeasonalPathBatch[] {
    const matched = collections.filter(items, (candidate: SeasonalPathBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalPathBatches(store: SeasonalPathBatchStore, query: SeasonalPathBatchQuery): SeasonalPathBatch[] {
  return query.apply(store.list());
}
