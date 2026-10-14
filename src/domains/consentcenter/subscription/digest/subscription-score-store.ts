import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionScore } from "./subscription-score.js";

/** Keeps subscription scores by code. */
export interface SubscriptionScoreStore {
  find(code: string): SubscriptionScore | undefined;
  save(item: SubscriptionScore): void;
  remove(code: string): boolean;
  list(): SubscriptionScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionScoreStore implements SubscriptionScoreStore {
  items: Map<string, SubscriptionScore>;
  order: string[];

  constructor(items: Map<string, SubscriptionScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionScore): void {
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

  list(): SubscriptionScore[] {
    const out: SubscriptionScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionScoreStore(): SubscriptionScoreStore {
  return new MemorySubscriptionScoreStore(new Map<string, SubscriptionScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionScoreStore implements SubscriptionScoreStore {
  inner: SubscriptionScoreStore;
  cache: cache.TtlCache<SubscriptionScore>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionScoreStore,
    cacheValue: cache.TtlCache<SubscriptionScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionScore | undefined {
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

  save(item: SubscriptionScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionScore[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionScoreStore(inner: SubscriptionScoreStore, ttl: number, clockValue: clock.Clock): SubscriptionScoreStore {
  return new CachedSubscriptionScoreStore(inner, cache.newTtlCache<SubscriptionScore>(512, ttl, clockValue), 0, 0);
}

/** Selects subscription scores. Empty fields match all. */
export class SubscriptionScoreQuery {
  channel: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minOpenRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionScore): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionScore[]): SubscriptionScore[] {
    const matched = collections.filter(items, (candidate: SubscriptionScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionScores(store: SubscriptionScoreStore, query: SubscriptionScoreQuery): SubscriptionScore[] {
  return query.apply(store.list());
}
