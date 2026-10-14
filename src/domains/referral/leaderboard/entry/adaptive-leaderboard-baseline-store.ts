import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveLeaderboardBaseline } from "./adaptive-leaderboard-baseline.js";

/** Keeps adaptive leaderboard baselines by code. */
export interface AdaptiveLeaderboardBaselineStore {
  find(code: string): AdaptiveLeaderboardBaseline | undefined;
  save(item: AdaptiveLeaderboardBaseline): void;
  remove(code: string): boolean;
  list(): AdaptiveLeaderboardBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveLeaderboardBaselineStore implements AdaptiveLeaderboardBaselineStore {
  items: Map<string, AdaptiveLeaderboardBaseline>;
  order: string[];

  constructor(items: Map<string, AdaptiveLeaderboardBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveLeaderboardBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveLeaderboardBaseline): void {
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

  list(): AdaptiveLeaderboardBaseline[] {
    const out: AdaptiveLeaderboardBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveLeaderboardBaselineStore(): AdaptiveLeaderboardBaselineStore {
  return new MemoryAdaptiveLeaderboardBaselineStore(new Map<string, AdaptiveLeaderboardBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveLeaderboardBaselineStore implements AdaptiveLeaderboardBaselineStore {
  inner: AdaptiveLeaderboardBaselineStore;
  cache: cache.TtlCache<AdaptiveLeaderboardBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveLeaderboardBaselineStore,
    cacheValue: cache.TtlCache<AdaptiveLeaderboardBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveLeaderboardBaseline | undefined {
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

  save(item: AdaptiveLeaderboardBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveLeaderboardBaseline[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveLeaderboardBaselineStore(inner: AdaptiveLeaderboardBaselineStore, ttl: number, clockValue: clock.Clock): AdaptiveLeaderboardBaselineStore {
  return new CachedAdaptiveLeaderboardBaselineStore(
    inner,
    cache.newTtlCache<AdaptiveLeaderboardBaseline>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive leaderboard baselines. Empty fields match all. */
export class AdaptiveLeaderboardBaselineQuery {
  segment: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minRevision: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveLeaderboardBaseline): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveLeaderboardBaseline[]): AdaptiveLeaderboardBaseline[] {
    const matched = collections.filter(items, (candidate: AdaptiveLeaderboardBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveLeaderboardBaselines(store: AdaptiveLeaderboardBaselineStore, query: AdaptiveLeaderboardBaselineQuery): AdaptiveLeaderboardBaseline[] {
  return query.apply(store.list());
}
