import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledPayoutScore } from "./scheduled-payout-score.js";

/** Keeps scheduled payout scores by code. */
export interface ScheduledPayoutScoreStore {
  find(code: string): ScheduledPayoutScore | undefined;
  save(item: ScheduledPayoutScore): void;
  remove(code: string): boolean;
  list(): ScheduledPayoutScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledPayoutScoreStore implements ScheduledPayoutScoreStore {
  items: Map<string, ScheduledPayoutScore>;
  order: string[];

  constructor(items: Map<string, ScheduledPayoutScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledPayoutScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledPayoutScore): void {
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

  list(): ScheduledPayoutScore[] {
    const out: ScheduledPayoutScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledPayoutScoreStore(): ScheduledPayoutScoreStore {
  return new MemoryScheduledPayoutScoreStore(new Map<string, ScheduledPayoutScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledPayoutScoreStore implements ScheduledPayoutScoreStore {
  inner: ScheduledPayoutScoreStore;
  cache: cache.TtlCache<ScheduledPayoutScore>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledPayoutScoreStore,
    cacheValue: cache.TtlCache<ScheduledPayoutScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledPayoutScore | undefined {
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

  save(item: ScheduledPayoutScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledPayoutScore[] {
    return this.inner.list();
  }
}

export function newCachedScheduledPayoutScoreStore(inner: ScheduledPayoutScoreStore, ttl: number, clockValue: clock.Clock): ScheduledPayoutScoreStore {
  return new CachedScheduledPayoutScoreStore(
    inner,
    cache.newTtlCache<ScheduledPayoutScore>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled payout scores. Empty fields match all. */
export class ScheduledPayoutScoreQuery {
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

  matches(item: ScheduledPayoutScore): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledPayoutScore[]): ScheduledPayoutScore[] {
    const matched = collections.filter(items, (candidate: ScheduledPayoutScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledPayoutScores(store: ScheduledPayoutScoreStore, query: ScheduledPayoutScoreQuery): ScheduledPayoutScore[] {
  return query.apply(store.list());
}
