import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveDeflectionScore } from "./adaptive-deflection-score.js";

/** Keeps adaptive deflection scores by code. */
export interface AdaptiveDeflectionScoreStore {
  find(code: string): AdaptiveDeflectionScore | undefined;
  save(item: AdaptiveDeflectionScore): void;
  remove(code: string): boolean;
  list(): AdaptiveDeflectionScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveDeflectionScoreStore implements AdaptiveDeflectionScoreStore {
  items: Map<string, AdaptiveDeflectionScore>;
  order: string[];

  constructor(items: Map<string, AdaptiveDeflectionScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveDeflectionScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveDeflectionScore): void {
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

  list(): AdaptiveDeflectionScore[] {
    const out: AdaptiveDeflectionScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveDeflectionScoreStore(): AdaptiveDeflectionScoreStore {
  return new MemoryAdaptiveDeflectionScoreStore(new Map<string, AdaptiveDeflectionScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveDeflectionScoreStore implements AdaptiveDeflectionScoreStore {
  inner: AdaptiveDeflectionScoreStore;
  cache: cache.TtlCache<AdaptiveDeflectionScore>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveDeflectionScoreStore,
    cacheValue: cache.TtlCache<AdaptiveDeflectionScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveDeflectionScore | undefined {
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

  save(item: AdaptiveDeflectionScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveDeflectionScore[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveDeflectionScoreStore(inner: AdaptiveDeflectionScoreStore, ttl: number, clockValue: clock.Clock): AdaptiveDeflectionScoreStore {
  return new CachedAdaptiveDeflectionScoreStore(
    inner,
    cache.newTtlCache<AdaptiveDeflectionScore>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive deflection scores. Empty fields match all. */
export class AdaptiveDeflectionScoreQuery {
  region: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.region = region;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveDeflectionScore): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveDeflectionScore[]): AdaptiveDeflectionScore[] {
    const matched = collections.filter(items, (candidate: AdaptiveDeflectionScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveDeflectionScores(store: AdaptiveDeflectionScoreStore, query: AdaptiveDeflectionScoreQuery): AdaptiveDeflectionScore[] {
  return query.apply(store.list());
}
