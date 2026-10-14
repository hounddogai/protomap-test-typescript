import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveFraudCheckScore } from "./adaptive-fraud-check-score.js";

/** Keeps adaptive fraud check scores by code. */
export interface AdaptiveFraudCheckScoreStore {
  find(code: string): AdaptiveFraudCheckScore | undefined;
  save(item: AdaptiveFraudCheckScore): void;
  remove(code: string): boolean;
  list(): AdaptiveFraudCheckScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveFraudCheckScoreStore implements AdaptiveFraudCheckScoreStore {
  items: Map<string, AdaptiveFraudCheckScore>;
  order: string[];

  constructor(items: Map<string, AdaptiveFraudCheckScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveFraudCheckScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveFraudCheckScore): void {
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

  list(): AdaptiveFraudCheckScore[] {
    const out: AdaptiveFraudCheckScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveFraudCheckScoreStore(): AdaptiveFraudCheckScoreStore {
  return new MemoryAdaptiveFraudCheckScoreStore(new Map<string, AdaptiveFraudCheckScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveFraudCheckScoreStore implements AdaptiveFraudCheckScoreStore {
  inner: AdaptiveFraudCheckScoreStore;
  cache: cache.TtlCache<AdaptiveFraudCheckScore>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveFraudCheckScoreStore,
    cacheValue: cache.TtlCache<AdaptiveFraudCheckScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveFraudCheckScore | undefined {
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

  save(item: AdaptiveFraudCheckScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveFraudCheckScore[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveFraudCheckScoreStore(inner: AdaptiveFraudCheckScoreStore, ttl: number, clockValue: clock.Clock): AdaptiveFraudCheckScoreStore {
  return new CachedAdaptiveFraudCheckScoreStore(
    inner,
    cache.newTtlCache<AdaptiveFraudCheckScore>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive fraud check scores. Empty fields match all. */
export class AdaptiveFraudCheckScoreQuery {
  region: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minBid: number, statuses: string[], limit: number) {
    this.region = region;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveFraudCheckScore): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveFraudCheckScore[]): AdaptiveFraudCheckScore[] {
    const matched = collections.filter(items, (candidate: AdaptiveFraudCheckScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveFraudCheckScores(store: AdaptiveFraudCheckScoreStore, query: AdaptiveFraudCheckScoreQuery): AdaptiveFraudCheckScore[] {
  return query.apply(store.list());
}
