import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortScore } from "./cohort-score.js";

/** Keeps cohort scores by code. */
export interface CohortScoreStore {
  find(code: string): CohortScore | undefined;
  save(item: CohortScore): void;
  remove(code: string): boolean;
  list(): CohortScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortScoreStore implements CohortScoreStore {
  items: Map<string, CohortScore>;
  order: string[];

  constructor(items: Map<string, CohortScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortScore): void {
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

  list(): CohortScore[] {
    const out: CohortScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortScoreStore(): CohortScoreStore {
  return new MemoryCohortScoreStore(new Map<string, CohortScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortScoreStore implements CohortScoreStore {
  inner: CohortScoreStore;
  cache: cache.TtlCache<CohortScore>;
  hits: number;
  misses: number;

  constructor(inner: CohortScoreStore, cacheValue: cache.TtlCache<CohortScore>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortScore | undefined {
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

  save(item: CohortScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortScore[] {
    return this.inner.list();
  }
}

export function newCachedCohortScoreStore(inner: CohortScoreStore, ttl: number, clockValue: clock.Clock): CohortScoreStore {
  return new CachedCohortScoreStore(inner, cache.newTtlCache<CohortScore>(1024, ttl, clockValue), 0, 0);
}

/** Selects cohort scores. Empty fields match all. */
export class CohortScoreQuery {
  title: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minThreshold: number, statuses: string[], limit: number) {
    this.title = title;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortScore): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortScore[]): CohortScore[] {
    const matched = collections.filter(items, (candidate: CohortScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortScores(store: CohortScoreStore, query: CohortScoreQuery): CohortScore[] {
  return query.apply(store.list());
}
