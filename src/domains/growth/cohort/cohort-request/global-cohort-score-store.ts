import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalCohortScore } from "./global-cohort-score.js";

/** Keeps global cohort scores by code. */
export interface GlobalCohortScoreStore {
  find(code: string): GlobalCohortScore | undefined;
  save(item: GlobalCohortScore): void;
  remove(code: string): boolean;
  list(): GlobalCohortScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalCohortScoreStore implements GlobalCohortScoreStore {
  items: Map<string, GlobalCohortScore>;
  order: string[];

  constructor(items: Map<string, GlobalCohortScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalCohortScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalCohortScore): void {
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

  list(): GlobalCohortScore[] {
    const out: GlobalCohortScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalCohortScoreStore(): GlobalCohortScoreStore {
  return new MemoryGlobalCohortScoreStore(new Map<string, GlobalCohortScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalCohortScoreStore implements GlobalCohortScoreStore {
  inner: GlobalCohortScoreStore;
  cache: cache.TtlCache<GlobalCohortScore>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalCohortScoreStore,
    cacheValue: cache.TtlCache<GlobalCohortScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalCohortScore | undefined {
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

  save(item: GlobalCohortScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalCohortScore[] {
    return this.inner.list();
  }
}

export function newCachedGlobalCohortScoreStore(inner: GlobalCohortScoreStore, ttl: number, clockValue: clock.Clock): GlobalCohortScoreStore {
  return new CachedGlobalCohortScoreStore(inner, cache.newTtlCache<GlobalCohortScore>(256, ttl, clockValue), 0, 0);
}

/** Selects global cohort scores. Empty fields match all. */
export class GlobalCohortScoreQuery {
  region: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minBudget: number, statuses: string[], limit: number) {
    this.region = region;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalCohortScore): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalCohortScore[]): GlobalCohortScore[] {
    const matched = collections.filter(items, (candidate: GlobalCohortScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalCohortScores(store: GlobalCohortScoreStore, query: GlobalCohortScoreQuery): GlobalCohortScore[] {
  return query.apply(store.list());
}
