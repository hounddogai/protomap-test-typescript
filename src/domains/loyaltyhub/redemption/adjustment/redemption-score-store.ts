import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionScore } from "./redemption-score.js";

/** Keeps redemption scores by code. */
export interface RedemptionScoreStore {
  find(code: string): RedemptionScore | undefined;
  save(item: RedemptionScore): void;
  remove(code: string): boolean;
  list(): RedemptionScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionScoreStore implements RedemptionScoreStore {
  items: Map<string, RedemptionScore>;
  order: string[];

  constructor(items: Map<string, RedemptionScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionScore): void {
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

  list(): RedemptionScore[] {
    const out: RedemptionScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionScoreStore(): RedemptionScoreStore {
  return new MemoryRedemptionScoreStore(new Map<string, RedemptionScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionScoreStore implements RedemptionScoreStore {
  inner: RedemptionScoreStore;
  cache: cache.TtlCache<RedemptionScore>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionScoreStore,
    cacheValue: cache.TtlCache<RedemptionScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionScore | undefined {
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

  save(item: RedemptionScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionScore[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionScoreStore(inner: RedemptionScoreStore, ttl: number, clockValue: clock.Clock): RedemptionScoreStore {
  return new CachedRedemptionScoreStore(inner, cache.newTtlCache<RedemptionScore>(256, ttl, clockValue), 0, 0);
}

/** Selects redemption scores. Empty fields match all. */
export class RedemptionScoreQuery {
  channel: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionScore): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionScore[]): RedemptionScore[] {
    const matched = collections.filter(items, (candidate: RedemptionScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionScores(store: RedemptionScoreStore, query: RedemptionScoreQuery): RedemptionScore[] {
  return query.apply(store.list());
}
