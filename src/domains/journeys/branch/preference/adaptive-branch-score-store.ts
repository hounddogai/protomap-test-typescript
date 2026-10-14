import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveBranchScore } from "./adaptive-branch-score.js";

/** Keeps adaptive branch scores by code. */
export interface AdaptiveBranchScoreStore {
  find(code: string): AdaptiveBranchScore | undefined;
  save(item: AdaptiveBranchScore): void;
  remove(code: string): boolean;
  list(): AdaptiveBranchScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveBranchScoreStore implements AdaptiveBranchScoreStore {
  items: Map<string, AdaptiveBranchScore>;
  order: string[];

  constructor(items: Map<string, AdaptiveBranchScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveBranchScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveBranchScore): void {
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

  list(): AdaptiveBranchScore[] {
    const out: AdaptiveBranchScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveBranchScoreStore(): AdaptiveBranchScoreStore {
  return new MemoryAdaptiveBranchScoreStore(new Map<string, AdaptiveBranchScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveBranchScoreStore implements AdaptiveBranchScoreStore {
  inner: AdaptiveBranchScoreStore;
  cache: cache.TtlCache<AdaptiveBranchScore>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveBranchScoreStore,
    cacheValue: cache.TtlCache<AdaptiveBranchScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveBranchScore | undefined {
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

  save(item: AdaptiveBranchScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveBranchScore[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveBranchScoreStore(inner: AdaptiveBranchScoreStore, ttl: number, clockValue: clock.Clock): AdaptiveBranchScoreStore {
  return new CachedAdaptiveBranchScoreStore(inner, cache.newTtlCache<AdaptiveBranchScore>(1024, ttl, clockValue), 0, 0);
}

/** Selects adaptive branch scores. Empty fields match all. */
export class AdaptiveBranchScoreQuery {
  title: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCeiling: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveBranchScore): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveBranchScore[]): AdaptiveBranchScore[] {
    const matched = collections.filter(items, (candidate: AdaptiveBranchScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveBranchScores(store: AdaptiveBranchScoreStore, query: AdaptiveBranchScoreQuery): AdaptiveBranchScore[] {
  return query.apply(store.list());
}
