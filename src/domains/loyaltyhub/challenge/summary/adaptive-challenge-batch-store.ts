import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveChallengeBatch } from "./adaptive-challenge-batch.js";

/** Keeps adaptive challenge batches by code. */
export interface AdaptiveChallengeBatchStore {
  find(code: string): AdaptiveChallengeBatch | undefined;
  save(item: AdaptiveChallengeBatch): void;
  remove(code: string): boolean;
  list(): AdaptiveChallengeBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveChallengeBatchStore implements AdaptiveChallengeBatchStore {
  items: Map<string, AdaptiveChallengeBatch>;
  order: string[];

  constructor(items: Map<string, AdaptiveChallengeBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveChallengeBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveChallengeBatch): void {
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

  list(): AdaptiveChallengeBatch[] {
    const out: AdaptiveChallengeBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveChallengeBatchStore(): AdaptiveChallengeBatchStore {
  return new MemoryAdaptiveChallengeBatchStore(new Map<string, AdaptiveChallengeBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveChallengeBatchStore implements AdaptiveChallengeBatchStore {
  inner: AdaptiveChallengeBatchStore;
  cache: cache.TtlCache<AdaptiveChallengeBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveChallengeBatchStore,
    cacheValue: cache.TtlCache<AdaptiveChallengeBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveChallengeBatch | undefined {
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

  save(item: AdaptiveChallengeBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveChallengeBatch[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveChallengeBatchStore(inner: AdaptiveChallengeBatchStore, ttl: number, clockValue: clock.Clock): AdaptiveChallengeBatchStore {
  return new CachedAdaptiveChallengeBatchStore(
    inner,
    cache.newTtlCache<AdaptiveChallengeBatch>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive challenge batches. Empty fields match all. */
export class AdaptiveChallengeBatchQuery {
  label: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCost: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveChallengeBatch): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveChallengeBatch[]): AdaptiveChallengeBatch[] {
    const matched = collections.filter(items, (candidate: AdaptiveChallengeBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveChallengeBatches(store: AdaptiveChallengeBatchStore, query: AdaptiveChallengeBatchQuery): AdaptiveChallengeBatch[] {
  return query.apply(store.list());
}
