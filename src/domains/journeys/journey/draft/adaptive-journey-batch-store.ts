import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveJourneyBatch } from "./adaptive-journey-batch.js";

/** Keeps adaptive journey batches by code. */
export interface AdaptiveJourneyBatchStore {
  find(code: string): AdaptiveJourneyBatch | undefined;
  save(item: AdaptiveJourneyBatch): void;
  remove(code: string): boolean;
  list(): AdaptiveJourneyBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveJourneyBatchStore implements AdaptiveJourneyBatchStore {
  items: Map<string, AdaptiveJourneyBatch>;
  order: string[];

  constructor(items: Map<string, AdaptiveJourneyBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveJourneyBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveJourneyBatch): void {
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

  list(): AdaptiveJourneyBatch[] {
    const out: AdaptiveJourneyBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveJourneyBatchStore(): AdaptiveJourneyBatchStore {
  return new MemoryAdaptiveJourneyBatchStore(new Map<string, AdaptiveJourneyBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveJourneyBatchStore implements AdaptiveJourneyBatchStore {
  inner: AdaptiveJourneyBatchStore;
  cache: cache.TtlCache<AdaptiveJourneyBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveJourneyBatchStore,
    cacheValue: cache.TtlCache<AdaptiveJourneyBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveJourneyBatch | undefined {
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

  save(item: AdaptiveJourneyBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveJourneyBatch[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveJourneyBatchStore(inner: AdaptiveJourneyBatchStore, ttl: number, clockValue: clock.Clock): AdaptiveJourneyBatchStore {
  return new CachedAdaptiveJourneyBatchStore(
    inner,
    cache.newTtlCache<AdaptiveJourneyBatch>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive journey batches. Empty fields match all. */
export class AdaptiveJourneyBatchQuery {
  title: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRevision: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveJourneyBatch): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveJourneyBatch[]): AdaptiveJourneyBatch[] {
    const matched = collections.filter(items, (candidate: AdaptiveJourneyBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveJourneyBatches(store: AdaptiveJourneyBatchStore, query: AdaptiveJourneyBatchQuery): AdaptiveJourneyBatch[] {
  return query.apply(store.list());
}
