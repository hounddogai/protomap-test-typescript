import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalDoubleOptInBatch } from "./seasonal-double-opt-in-batch.js";

/** Keeps seasonal double opt in batches by code. */
export interface SeasonalDoubleOptInBatchStore {
  find(code: string): SeasonalDoubleOptInBatch | undefined;
  save(item: SeasonalDoubleOptInBatch): void;
  remove(code: string): boolean;
  list(): SeasonalDoubleOptInBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalDoubleOptInBatchStore implements SeasonalDoubleOptInBatchStore {
  items: Map<string, SeasonalDoubleOptInBatch>;
  order: string[];

  constructor(items: Map<string, SeasonalDoubleOptInBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalDoubleOptInBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalDoubleOptInBatch): void {
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

  list(): SeasonalDoubleOptInBatch[] {
    const out: SeasonalDoubleOptInBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalDoubleOptInBatchStore(): SeasonalDoubleOptInBatchStore {
  return new MemorySeasonalDoubleOptInBatchStore(new Map<string, SeasonalDoubleOptInBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalDoubleOptInBatchStore implements SeasonalDoubleOptInBatchStore {
  inner: SeasonalDoubleOptInBatchStore;
  cache: cache.TtlCache<SeasonalDoubleOptInBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalDoubleOptInBatchStore,
    cacheValue: cache.TtlCache<SeasonalDoubleOptInBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalDoubleOptInBatch | undefined {
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

  save(item: SeasonalDoubleOptInBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalDoubleOptInBatch[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalDoubleOptInBatchStore(inner: SeasonalDoubleOptInBatchStore, ttl: number, clockValue: clock.Clock): SeasonalDoubleOptInBatchStore {
  return new CachedSeasonalDoubleOptInBatchStore(
    inner,
    cache.newTtlCache<SeasonalDoubleOptInBatch>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal double opt in batches. Empty fields match all. */
export class SeasonalDoubleOptInBatchQuery {
  utmSource: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minFloorValue: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalDoubleOptInBatch): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalDoubleOptInBatch[]): SeasonalDoubleOptInBatch[] {
    const matched = collections.filter(items, (candidate: SeasonalDoubleOptInBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalDoubleOptInBatches(store: SeasonalDoubleOptInBatchStore, query: SeasonalDoubleOptInBatchQuery): SeasonalDoubleOptInBatch[] {
  return query.apply(store.list());
}
