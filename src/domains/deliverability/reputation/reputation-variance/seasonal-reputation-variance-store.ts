import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalReputationVariance } from "./seasonal-reputation-variance.js";

/** Keeps seasonal reputation variances by code. */
export interface SeasonalReputationVarianceStore {
  find(code: string): SeasonalReputationVariance | undefined;
  save(item: SeasonalReputationVariance): void;
  remove(code: string): boolean;
  list(): SeasonalReputationVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalReputationVarianceStore implements SeasonalReputationVarianceStore {
  items: Map<string, SeasonalReputationVariance>;
  order: string[];

  constructor(items: Map<string, SeasonalReputationVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalReputationVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalReputationVariance): void {
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

  list(): SeasonalReputationVariance[] {
    const out: SeasonalReputationVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalReputationVarianceStore(): SeasonalReputationVarianceStore {
  return new MemorySeasonalReputationVarianceStore(new Map<string, SeasonalReputationVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalReputationVarianceStore implements SeasonalReputationVarianceStore {
  inner: SeasonalReputationVarianceStore;
  cache: cache.TtlCache<SeasonalReputationVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalReputationVarianceStore,
    cacheValue: cache.TtlCache<SeasonalReputationVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalReputationVariance | undefined {
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

  save(item: SeasonalReputationVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalReputationVariance[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalReputationVarianceStore(inner: SeasonalReputationVarianceStore, ttl: number, clockValue: clock.Clock): SeasonalReputationVarianceStore {
  return new CachedSeasonalReputationVarianceStore(
    inner,
    cache.newTtlCache<SeasonalReputationVariance>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal reputation variances. Empty fields match all. */
export class SeasonalReputationVarianceQuery {
  channel: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBid: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalReputationVariance): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalReputationVariance[]): SeasonalReputationVariance[] {
    const matched = collections.filter(items, (candidate: SeasonalReputationVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalReputationVariances(store: SeasonalReputationVarianceStore, query: SeasonalReputationVarianceQuery): SeasonalReputationVariance[] {
  return query.apply(store.list());
}
