import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredSubscriptionScore } from "./tiered-subscription-score.js";

/** Keeps tiered subscription scores by code. */
export interface TieredSubscriptionScoreStore {
  find(code: string): TieredSubscriptionScore | undefined;
  save(item: TieredSubscriptionScore): void;
  remove(code: string): boolean;
  list(): TieredSubscriptionScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredSubscriptionScoreStore implements TieredSubscriptionScoreStore {
  items: Map<string, TieredSubscriptionScore>;
  order: string[];

  constructor(items: Map<string, TieredSubscriptionScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredSubscriptionScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredSubscriptionScore): void {
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

  list(): TieredSubscriptionScore[] {
    const out: TieredSubscriptionScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredSubscriptionScoreStore(): TieredSubscriptionScoreStore {
  return new MemoryTieredSubscriptionScoreStore(new Map<string, TieredSubscriptionScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredSubscriptionScoreStore implements TieredSubscriptionScoreStore {
  inner: TieredSubscriptionScoreStore;
  cache: cache.TtlCache<TieredSubscriptionScore>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredSubscriptionScoreStore,
    cacheValue: cache.TtlCache<TieredSubscriptionScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredSubscriptionScore | undefined {
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

  save(item: TieredSubscriptionScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredSubscriptionScore[] {
    return this.inner.list();
  }
}

export function newCachedTieredSubscriptionScoreStore(inner: TieredSubscriptionScoreStore, ttl: number, clockValue: clock.Clock): TieredSubscriptionScoreStore {
  return new CachedTieredSubscriptionScoreStore(
    inner,
    cache.newTtlCache<TieredSubscriptionScore>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered subscription scores. Empty fields match all. */
export class TieredSubscriptionScoreQuery {
  label: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMinimum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredSubscriptionScore): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredSubscriptionScore[]): TieredSubscriptionScore[] {
    const matched = collections.filter(items, (candidate: TieredSubscriptionScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredSubscriptionScores(store: TieredSubscriptionScoreStore, query: TieredSubscriptionScoreQuery): TieredSubscriptionScore[] {
  return query.apply(store.list());
}
