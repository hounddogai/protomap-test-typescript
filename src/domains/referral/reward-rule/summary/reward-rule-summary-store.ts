import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleSummary } from "./reward-rule-summary.js";

/** Keeps reward rule summaries by code. */
export interface RewardRuleSummaryStore {
  find(code: string): RewardRuleSummary | undefined;
  save(item: RewardRuleSummary): void;
  remove(code: string): boolean;
  list(): RewardRuleSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleSummaryStore implements RewardRuleSummaryStore {
  items: Map<string, RewardRuleSummary>;
  order: string[];

  constructor(items: Map<string, RewardRuleSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleSummary): void {
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

  list(): RewardRuleSummary[] {
    const out: RewardRuleSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleSummaryStore(): RewardRuleSummaryStore {
  return new MemoryRewardRuleSummaryStore(new Map<string, RewardRuleSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleSummaryStore implements RewardRuleSummaryStore {
  inner: RewardRuleSummaryStore;
  cache: cache.TtlCache<RewardRuleSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleSummaryStore,
    cacheValue: cache.TtlCache<RewardRuleSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleSummary | undefined {
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

  save(item: RewardRuleSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleSummary[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleSummaryStore(inner: RewardRuleSummaryStore, ttl: number, clockValue: clock.Clock): RewardRuleSummaryStore {
  return new CachedRewardRuleSummaryStore(inner, cache.newTtlCache<RewardRuleSummary>(256, ttl, clockValue), 0, 0);
}

/** Selects reward rule summaries. Empty fields match all. */
export class RewardRuleSummaryQuery {
  locale: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minImpressions: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleSummary): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleSummary[]): RewardRuleSummary[] {
    const matched = collections.filter(items, (candidate: RewardRuleSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleSummaries(store: RewardRuleSummaryStore, query: RewardRuleSummaryQuery): RewardRuleSummary[] {
  return query.apply(store.list());
}
