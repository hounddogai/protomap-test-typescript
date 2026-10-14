import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TierScore } from "./tier-score.js";

/** Keeps tier scores by code. */
export interface TierScoreStore {
  find(code: string): TierScore | undefined;
  save(item: TierScore): void;
  remove(code: string): boolean;
  list(): TierScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTierScoreStore implements TierScoreStore {
  items: Map<string, TierScore>;
  order: string[];

  constructor(items: Map<string, TierScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TierScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TierScore): void {
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

  list(): TierScore[] {
    const out: TierScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTierScoreStore(): TierScoreStore {
  return new MemoryTierScoreStore(new Map<string, TierScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTierScoreStore implements TierScoreStore {
  inner: TierScoreStore;
  cache: cache.TtlCache<TierScore>;
  hits: number;
  misses: number;

  constructor(inner: TierScoreStore, cacheValue: cache.TtlCache<TierScore>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TierScore | undefined {
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

  save(item: TierScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TierScore[] {
    return this.inner.list();
  }
}

export function newCachedTierScoreStore(inner: TierScoreStore, ttl: number, clockValue: clock.Clock): TierScoreStore {
  return new CachedTierScoreStore(inner, cache.newTtlCache<TierScore>(1024, ttl, clockValue), 0, 0);
}

/** Selects tier scores. Empty fields match all. */
export class TierScoreQuery {
  name: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minStartsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TierScore): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TierScore[]): TierScore[] {
    const matched = collections.filter(items, (candidate: TierScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTierScores(store: TierScoreStore, query: TierScoreQuery): TierScore[] {
  return query.apply(store.list());
}
