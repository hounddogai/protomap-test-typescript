import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingRedemptionScore } from "./rolling-redemption-score.js";

/** Keeps rolling redemption scores by code. */
export interface RollingRedemptionScoreStore {
  find(code: string): RollingRedemptionScore | undefined;
  save(item: RollingRedemptionScore): void;
  remove(code: string): boolean;
  list(): RollingRedemptionScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingRedemptionScoreStore implements RollingRedemptionScoreStore {
  items: Map<string, RollingRedemptionScore>;
  order: string[];

  constructor(items: Map<string, RollingRedemptionScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingRedemptionScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingRedemptionScore): void {
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

  list(): RollingRedemptionScore[] {
    const out: RollingRedemptionScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingRedemptionScoreStore(): RollingRedemptionScoreStore {
  return new MemoryRollingRedemptionScoreStore(new Map<string, RollingRedemptionScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingRedemptionScoreStore implements RollingRedemptionScoreStore {
  inner: RollingRedemptionScoreStore;
  cache: cache.TtlCache<RollingRedemptionScore>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingRedemptionScoreStore,
    cacheValue: cache.TtlCache<RollingRedemptionScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingRedemptionScore | undefined {
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

  save(item: RollingRedemptionScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingRedemptionScore[] {
    return this.inner.list();
  }
}

export function newCachedRollingRedemptionScoreStore(inner: RollingRedemptionScoreStore, ttl: number, clockValue: clock.Clock): RollingRedemptionScoreStore {
  return new CachedRollingRedemptionScoreStore(
    inner,
    cache.newTtlCache<RollingRedemptionScore>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling redemption scores. Empty fields match all. */
export class RollingRedemptionScoreQuery {
  utmSource: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minBudget: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingRedemptionScore): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingRedemptionScore[]): RollingRedemptionScore[] {
    const matched = collections.filter(items, (candidate: RollingRedemptionScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingRedemptionScores(store: RollingRedemptionScoreStore, query: RollingRedemptionScoreQuery): RollingRedemptionScore[] {
  return query.apply(store.list());
}
