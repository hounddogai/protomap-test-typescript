import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakScore } from "./streak-score.js";

/** Keeps streak scores by code. */
export interface StreakScoreStore {
  find(code: string): StreakScore | undefined;
  save(item: StreakScore): void;
  remove(code: string): boolean;
  list(): StreakScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakScoreStore implements StreakScoreStore {
  items: Map<string, StreakScore>;
  order: string[];

  constructor(items: Map<string, StreakScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakScore): void {
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

  list(): StreakScore[] {
    const out: StreakScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakScoreStore(): StreakScoreStore {
  return new MemoryStreakScoreStore(new Map<string, StreakScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakScoreStore implements StreakScoreStore {
  inner: StreakScoreStore;
  cache: cache.TtlCache<StreakScore>;
  hits: number;
  misses: number;

  constructor(inner: StreakScoreStore, cacheValue: cache.TtlCache<StreakScore>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakScore | undefined {
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

  save(item: StreakScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakScore[] {
    return this.inner.list();
  }
}

export function newCachedStreakScoreStore(inner: StreakScoreStore, ttl: number, clockValue: clock.Clock): StreakScoreStore {
  return new CachedStreakScoreStore(inner, cache.newTtlCache<StreakScore>(64, ttl, clockValue), 0, 0);
}

/** Selects streak scores. Empty fields match all. */
export class StreakScoreQuery {
  title: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.title = title;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakScore): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakScore[]): StreakScore[] {
    const matched = collections.filter(items, (candidate: StreakScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakScores(store: StreakScoreStore, query: StreakScoreQuery): StreakScore[] {
  return query.apply(store.list());
}
