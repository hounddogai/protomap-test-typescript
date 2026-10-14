import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackSubscriptionScore } from "./fallback-subscription-score.js";

/** Keeps fallback subscription scores by code. */
export interface FallbackSubscriptionScoreStore {
  find(code: string): FallbackSubscriptionScore | undefined;
  save(item: FallbackSubscriptionScore): void;
  remove(code: string): boolean;
  list(): FallbackSubscriptionScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackSubscriptionScoreStore implements FallbackSubscriptionScoreStore {
  items: Map<string, FallbackSubscriptionScore>;
  order: string[];

  constructor(items: Map<string, FallbackSubscriptionScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackSubscriptionScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackSubscriptionScore): void {
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

  list(): FallbackSubscriptionScore[] {
    const out: FallbackSubscriptionScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackSubscriptionScoreStore(): FallbackSubscriptionScoreStore {
  return new MemoryFallbackSubscriptionScoreStore(new Map<string, FallbackSubscriptionScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackSubscriptionScoreStore implements FallbackSubscriptionScoreStore {
  inner: FallbackSubscriptionScoreStore;
  cache: cache.TtlCache<FallbackSubscriptionScore>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackSubscriptionScoreStore,
    cacheValue: cache.TtlCache<FallbackSubscriptionScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackSubscriptionScore | undefined {
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

  save(item: FallbackSubscriptionScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackSubscriptionScore[] {
    return this.inner.list();
  }
}

export function newCachedFallbackSubscriptionScoreStore(inner: FallbackSubscriptionScoreStore, ttl: number, clockValue: clock.Clock): FallbackSubscriptionScoreStore {
  return new CachedFallbackSubscriptionScoreStore(
    inner,
    cache.newTtlCache<FallbackSubscriptionScore>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback subscription scores. Empty fields match all. */
export class FallbackSubscriptionScoreQuery {
  channel: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCeiling: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackSubscriptionScore): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackSubscriptionScore[]): FallbackSubscriptionScore[] {
    const matched = collections.filter(items, (candidate: FallbackSubscriptionScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackSubscriptionScores(store: FallbackSubscriptionScoreStore, query: FallbackSubscriptionScoreQuery): FallbackSubscriptionScore[] {
  return query.apply(store.list());
}
