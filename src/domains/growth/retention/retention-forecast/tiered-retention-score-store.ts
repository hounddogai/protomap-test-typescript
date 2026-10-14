import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredRetentionScore } from "./tiered-retention-score.js";

/** Keeps tiered retention scores by code. */
export interface TieredRetentionScoreStore {
  find(code: string): TieredRetentionScore | undefined;
  save(item: TieredRetentionScore): void;
  remove(code: string): boolean;
  list(): TieredRetentionScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredRetentionScoreStore implements TieredRetentionScoreStore {
  items: Map<string, TieredRetentionScore>;
  order: string[];

  constructor(items: Map<string, TieredRetentionScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredRetentionScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredRetentionScore): void {
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

  list(): TieredRetentionScore[] {
    const out: TieredRetentionScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredRetentionScoreStore(): TieredRetentionScoreStore {
  return new MemoryTieredRetentionScoreStore(new Map<string, TieredRetentionScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredRetentionScoreStore implements TieredRetentionScoreStore {
  inner: TieredRetentionScoreStore;
  cache: cache.TtlCache<TieredRetentionScore>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredRetentionScoreStore,
    cacheValue: cache.TtlCache<TieredRetentionScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredRetentionScore | undefined {
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

  save(item: TieredRetentionScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredRetentionScore[] {
    return this.inner.list();
  }
}

export function newCachedTieredRetentionScoreStore(inner: TieredRetentionScoreStore, ttl: number, clockValue: clock.Clock): TieredRetentionScoreStore {
  return new CachedTieredRetentionScoreStore(
    inner,
    cache.newTtlCache<TieredRetentionScore>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered retention scores. Empty fields match all. */
export class TieredRetentionScoreQuery {
  locale: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBudget: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredRetentionScore): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredRetentionScore[]): TieredRetentionScore[] {
    const matched = collections.filter(items, (candidate: TieredRetentionScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredRetentionScores(store: TieredRetentionScoreStore, query: TieredRetentionScoreQuery): TieredRetentionScore[] {
  return query.apply(store.list());
}
