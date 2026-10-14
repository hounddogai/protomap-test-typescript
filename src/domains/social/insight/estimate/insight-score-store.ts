import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightScore } from "./insight-score.js";

/** Keeps insight scores by code. */
export interface InsightScoreStore {
  find(code: string): InsightScore | undefined;
  save(item: InsightScore): void;
  remove(code: string): boolean;
  list(): InsightScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightScoreStore implements InsightScoreStore {
  items: Map<string, InsightScore>;
  order: string[];

  constructor(items: Map<string, InsightScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightScore): void {
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

  list(): InsightScore[] {
    const out: InsightScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightScoreStore(): InsightScoreStore {
  return new MemoryInsightScoreStore(new Map<string, InsightScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightScoreStore implements InsightScoreStore {
  inner: InsightScoreStore;
  cache: cache.TtlCache<InsightScore>;
  hits: number;
  misses: number;

  constructor(inner: InsightScoreStore, cacheValue: cache.TtlCache<InsightScore>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightScore | undefined {
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

  save(item: InsightScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightScore[] {
    return this.inner.list();
  }
}

export function newCachedInsightScoreStore(inner: InsightScoreStore, ttl: number, clockValue: clock.Clock): InsightScoreStore {
  return new CachedInsightScoreStore(inner, cache.newTtlCache<InsightScore>(64, ttl, clockValue), 0, 0);
}

/** Selects insight scores. Empty fields match all. */
export class InsightScoreQuery {
  unit: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minCeiling: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightScore): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightScore[]): InsightScore[] {
    const matched = collections.filter(items, (candidate: InsightScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightScores(store: InsightScoreStore, query: InsightScoreQuery): InsightScore[] {
  return query.apply(store.list());
}
