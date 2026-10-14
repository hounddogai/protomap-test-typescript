import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveStreakScore } from "./adaptive-streak-score.js";

/** Keeps adaptive streak scores by code. */
export interface AdaptiveStreakScoreStore {
  find(code: string): AdaptiveStreakScore | undefined;
  save(item: AdaptiveStreakScore): void;
  remove(code: string): boolean;
  list(): AdaptiveStreakScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveStreakScoreStore implements AdaptiveStreakScoreStore {
  items: Map<string, AdaptiveStreakScore>;
  order: string[];

  constructor(items: Map<string, AdaptiveStreakScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveStreakScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveStreakScore): void {
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

  list(): AdaptiveStreakScore[] {
    const out: AdaptiveStreakScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveStreakScoreStore(): AdaptiveStreakScoreStore {
  return new MemoryAdaptiveStreakScoreStore(new Map<string, AdaptiveStreakScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveStreakScoreStore implements AdaptiveStreakScoreStore {
  inner: AdaptiveStreakScoreStore;
  cache: cache.TtlCache<AdaptiveStreakScore>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveStreakScoreStore,
    cacheValue: cache.TtlCache<AdaptiveStreakScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveStreakScore | undefined {
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

  save(item: AdaptiveStreakScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveStreakScore[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveStreakScoreStore(inner: AdaptiveStreakScoreStore, ttl: number, clockValue: clock.Clock): AdaptiveStreakScoreStore {
  return new CachedAdaptiveStreakScoreStore(inner, cache.newTtlCache<AdaptiveStreakScore>(512, ttl, clockValue), 0, 0);
}

/** Selects adaptive streak scores. Empty fields match all. */
export class AdaptiveStreakScoreQuery {
  name: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minLimit: number, statuses: string[], limit: number) {
    this.name = name;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveStreakScore): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveStreakScore[]): AdaptiveStreakScore[] {
    const matched = collections.filter(items, (candidate: AdaptiveStreakScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveStreakScores(store: AdaptiveStreakScoreStore, query: AdaptiveStreakScoreQuery): AdaptiveStreakScore[] {
  return query.apply(store.list());
}
