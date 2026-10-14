import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingBidRuleScore } from "./pending-bid-rule-score.js";

/** Keeps pending bid rule scores by code. */
export interface PendingBidRuleScoreStore {
  find(code: string): PendingBidRuleScore | undefined;
  save(item: PendingBidRuleScore): void;
  remove(code: string): boolean;
  list(): PendingBidRuleScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingBidRuleScoreStore implements PendingBidRuleScoreStore {
  items: Map<string, PendingBidRuleScore>;
  order: string[];

  constructor(items: Map<string, PendingBidRuleScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingBidRuleScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingBidRuleScore): void {
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

  list(): PendingBidRuleScore[] {
    const out: PendingBidRuleScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingBidRuleScoreStore(): PendingBidRuleScoreStore {
  return new MemoryPendingBidRuleScoreStore(new Map<string, PendingBidRuleScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingBidRuleScoreStore implements PendingBidRuleScoreStore {
  inner: PendingBidRuleScoreStore;
  cache: cache.TtlCache<PendingBidRuleScore>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingBidRuleScoreStore,
    cacheValue: cache.TtlCache<PendingBidRuleScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingBidRuleScore | undefined {
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

  save(item: PendingBidRuleScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingBidRuleScore[] {
    return this.inner.list();
  }
}

export function newCachedPendingBidRuleScoreStore(inner: PendingBidRuleScoreStore, ttl: number, clockValue: clock.Clock): PendingBidRuleScoreStore {
  return new CachedPendingBidRuleScoreStore(inner, cache.newTtlCache<PendingBidRuleScore>(512, ttl, clockValue), 0, 0);
}

/** Selects pending bid rule scores. Empty fields match all. */
export class PendingBidRuleScoreQuery {
  utmSource: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minWindowDays: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingBidRuleScore): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingBidRuleScore[]): PendingBidRuleScore[] {
    const matched = collections.filter(items, (candidate: PendingBidRuleScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingBidRuleScores(store: PendingBidRuleScoreStore, query: PendingBidRuleScoreQuery): PendingBidRuleScore[] {
  return query.apply(store.list());
}
