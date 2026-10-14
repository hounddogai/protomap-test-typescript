import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedRedemptionScore } from "./capped-redemption-score.js";

/** Keeps capped redemption scores by code. */
export interface CappedRedemptionScoreStore {
  find(code: string): CappedRedemptionScore | undefined;
  save(item: CappedRedemptionScore): void;
  remove(code: string): boolean;
  list(): CappedRedemptionScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedRedemptionScoreStore implements CappedRedemptionScoreStore {
  items: Map<string, CappedRedemptionScore>;
  order: string[];

  constructor(items: Map<string, CappedRedemptionScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedRedemptionScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedRedemptionScore): void {
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

  list(): CappedRedemptionScore[] {
    const out: CappedRedemptionScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedRedemptionScoreStore(): CappedRedemptionScoreStore {
  return new MemoryCappedRedemptionScoreStore(new Map<string, CappedRedemptionScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedRedemptionScoreStore implements CappedRedemptionScoreStore {
  inner: CappedRedemptionScoreStore;
  cache: cache.TtlCache<CappedRedemptionScore>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedRedemptionScoreStore,
    cacheValue: cache.TtlCache<CappedRedemptionScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedRedemptionScore | undefined {
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

  save(item: CappedRedemptionScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedRedemptionScore[] {
    return this.inner.list();
  }
}

export function newCachedCappedRedemptionScoreStore(inner: CappedRedemptionScoreStore, ttl: number, clockValue: clock.Clock): CappedRedemptionScoreStore {
  return new CachedCappedRedemptionScoreStore(
    inner,
    cache.newTtlCache<CappedRedemptionScore>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped redemption scores. Empty fields match all. */
export class CappedRedemptionScoreQuery {
  region: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minQuantity: number, statuses: string[], limit: number) {
    this.region = region;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedRedemptionScore): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedRedemptionScore[]): CappedRedemptionScore[] {
    const matched = collections.filter(items, (candidate: CappedRedemptionScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedRedemptionScores(store: CappedRedemptionScoreStore, query: CappedRedemptionScoreQuery): CappedRedemptionScore[] {
  return query.apply(store.list());
}
