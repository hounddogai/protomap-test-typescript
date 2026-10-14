import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveDomainScore } from "./adaptive-domain-score.js";

/** Keeps adaptive domain scores by code. */
export interface AdaptiveDomainScoreStore {
  find(code: string): AdaptiveDomainScore | undefined;
  save(item: AdaptiveDomainScore): void;
  remove(code: string): boolean;
  list(): AdaptiveDomainScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveDomainScoreStore implements AdaptiveDomainScoreStore {
  items: Map<string, AdaptiveDomainScore>;
  order: string[];

  constructor(items: Map<string, AdaptiveDomainScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveDomainScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveDomainScore): void {
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

  list(): AdaptiveDomainScore[] {
    const out: AdaptiveDomainScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveDomainScoreStore(): AdaptiveDomainScoreStore {
  return new MemoryAdaptiveDomainScoreStore(new Map<string, AdaptiveDomainScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveDomainScoreStore implements AdaptiveDomainScoreStore {
  inner: AdaptiveDomainScoreStore;
  cache: cache.TtlCache<AdaptiveDomainScore>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveDomainScoreStore,
    cacheValue: cache.TtlCache<AdaptiveDomainScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveDomainScore | undefined {
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

  save(item: AdaptiveDomainScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveDomainScore[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveDomainScoreStore(inner: AdaptiveDomainScoreStore, ttl: number, clockValue: clock.Clock): AdaptiveDomainScoreStore {
  return new CachedAdaptiveDomainScoreStore(inner, cache.newTtlCache<AdaptiveDomainScore>(1024, ttl, clockValue), 0, 0);
}

/** Selects adaptive domain scores. Empty fields match all. */
export class AdaptiveDomainScoreQuery {
  name: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCeiling: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveDomainScore): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveDomainScore[]): AdaptiveDomainScore[] {
    const matched = collections.filter(items, (candidate: AdaptiveDomainScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveDomainScores(store: AdaptiveDomainScoreStore, query: AdaptiveDomainScoreQuery): AdaptiveDomainScore[] {
  return query.apply(store.list());
}
