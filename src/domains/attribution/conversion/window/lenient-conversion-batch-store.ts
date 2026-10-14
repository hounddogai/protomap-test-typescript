import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientConversionBatch } from "./lenient-conversion-batch.js";

/** Keeps lenient conversion batches by code. */
export interface LenientConversionBatchStore {
  find(code: string): LenientConversionBatch | undefined;
  save(item: LenientConversionBatch): void;
  remove(code: string): boolean;
  list(): LenientConversionBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientConversionBatchStore implements LenientConversionBatchStore {
  items: Map<string, LenientConversionBatch>;
  order: string[];

  constructor(items: Map<string, LenientConversionBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientConversionBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientConversionBatch): void {
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

  list(): LenientConversionBatch[] {
    const out: LenientConversionBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientConversionBatchStore(): LenientConversionBatchStore {
  return new MemoryLenientConversionBatchStore(new Map<string, LenientConversionBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientConversionBatchStore implements LenientConversionBatchStore {
  inner: LenientConversionBatchStore;
  cache: cache.TtlCache<LenientConversionBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientConversionBatchStore,
    cacheValue: cache.TtlCache<LenientConversionBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientConversionBatch | undefined {
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

  save(item: LenientConversionBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientConversionBatch[] {
    return this.inner.list();
  }
}

export function newCachedLenientConversionBatchStore(inner: LenientConversionBatchStore, ttl: number, clockValue: clock.Clock): LenientConversionBatchStore {
  return new CachedLenientConversionBatchStore(
    inner,
    cache.newTtlCache<LenientConversionBatch>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient conversion batches. Empty fields match all. */
export class LenientConversionBatchQuery {
  locale: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minImpressions: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientConversionBatch): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientConversionBatch[]): LenientConversionBatch[] {
    const matched = collections.filter(items, (candidate: LenientConversionBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientConversionBatches(store: LenientConversionBatchStore, query: LenientConversionBatchQuery): LenientConversionBatch[] {
  return query.apply(store.list());
}
