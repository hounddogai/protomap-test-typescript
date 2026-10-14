import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedRewardRuleSummary } from "./weighted-reward-rule-summary.js";

/** Keeps weighted reward rule summaries by code. */
export interface WeightedRewardRuleSummaryStore {
  find(code: string): WeightedRewardRuleSummary | undefined;
  save(item: WeightedRewardRuleSummary): void;
  remove(code: string): boolean;
  list(): WeightedRewardRuleSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedRewardRuleSummaryStore implements WeightedRewardRuleSummaryStore {
  items: Map<string, WeightedRewardRuleSummary>;
  order: string[];

  constructor(items: Map<string, WeightedRewardRuleSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedRewardRuleSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedRewardRuleSummary): void {
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

  list(): WeightedRewardRuleSummary[] {
    const out: WeightedRewardRuleSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedRewardRuleSummaryStore(): WeightedRewardRuleSummaryStore {
  return new MemoryWeightedRewardRuleSummaryStore(new Map<string, WeightedRewardRuleSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedRewardRuleSummaryStore implements WeightedRewardRuleSummaryStore {
  inner: WeightedRewardRuleSummaryStore;
  cache: cache.TtlCache<WeightedRewardRuleSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedRewardRuleSummaryStore,
    cacheValue: cache.TtlCache<WeightedRewardRuleSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedRewardRuleSummary | undefined {
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

  save(item: WeightedRewardRuleSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedRewardRuleSummary[] {
    return this.inner.list();
  }
}

export function newCachedWeightedRewardRuleSummaryStore(inner: WeightedRewardRuleSummaryStore, ttl: number, clockValue: clock.Clock): WeightedRewardRuleSummaryStore {
  return new CachedWeightedRewardRuleSummaryStore(
    inner,
    cache.newTtlCache<WeightedRewardRuleSummary>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted reward rule summaries. Empty fields match all. */
export class WeightedRewardRuleSummaryQuery {
  channel: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedRewardRuleSummary): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedRewardRuleSummary[]): WeightedRewardRuleSummary[] {
    const matched = collections.filter(items, (candidate: WeightedRewardRuleSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedRewardRuleSummaries(store: WeightedRewardRuleSummaryStore, query: WeightedRewardRuleSummaryQuery): WeightedRewardRuleSummary[] {
  return query.apply(store.list());
}
